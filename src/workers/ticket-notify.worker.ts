import * as tickets from '../services/tickets/ticket.service';
import * as csatSurveys from '../services/csat-surveys/csat-survey.service';
import { TicketDto } from '../services/tickets/ticket.schemas';
import * as guests from '../services/guests/guest.service';
import * as properties from '../services/properties/property.service';
import * as conversations from '../services/conversations/conversation.service';
import * as featureFlags from '../services/feature-flags/feature-flag.service';
import { FeatureFlagKeys } from '../services/feature-flags/feature-flag.keys';
import { resolveChannel } from '../channels/channel.resolver';
import {
  ticketInProgress,
  ticketResolved,
  resolveLanguage,
} from '../messages/ticket.messages';

/**
 * Ejecuta un ciclo de polling:
 * 1. Obtiene tickets con notifyGuestPending=true del backend.
 * 2. Verifica notification_ticket_status_guest_enabled para la propiedad.
 *    Si está desactivado, omite el envío sin modificar el estado.
 * 3. Solo procesa tickets que tengan guestId (sin huésped no hay a quién notificar).
 * 4. Obtiene en paralelo: guest, property y conversación asociada al ticket.
 * 5. Toma el idioma de conversation.languageDetected (fallback: guest.preferredLanguage → 'es').
 * 6. Envía el mensaje según notifyGuestStatus (assigned | in_progress | resolved).
 *    notifyGuestStatus captura el estado exacto que disparó la notificación,
 *    evitando enviar el mensaje equivocado si el ticket cambió de estado otra vez.
 * 7. Si el estado era 'resolved' y bot_csat_tickets_enabled, crea csat_surveys pending
 *    para que el csat.worker envíe el survey en el siguiente ciclo.
 * 8. Marca notifyGuestPending=false para no reenviar en el siguiente ciclo.
 */
export async function runTicketNotifyWorker(): Promise<void> {
  let pending: TicketDto[];

  try {
    pending = await tickets.getNotifyGuestPending();
    console.log('[ticket-notify-worker] fetch_result', { count: pending.length, ids: pending.map(t => t.id) });
  } catch (err) {
    console.error('[ticket-notify-worker] Error obteniendo tickets pendientes:', err);
    return;
  }

  if (pending.length === 0) {
    console.log('[ticket-notify-worker] no_pending_tickets');
    return;
  }

  console.log(`[ticket-notify-worker] ${pending.length} ticket(s) con notificación pendiente`);

  for (const ticket of pending) {
    await processTicketNotification(ticket);
  }
}

async function processTicketNotification(ticket: TicketDto): Promise<void> {
  try {
    console.log('[ticket-notify-worker] processing_ticket', { ticketId: ticket.id, status: ticket.status, notifyGuestStatus: ticket.notifyGuestStatus, guestId: ticket.guestId });

    if (!ticket.guestId) {
      // Sin huésped no hay canal — limpiar el flag igualmente
      await tickets.markNotified(ticket.id);
      return;
    }

    const [guest, property, conversation] = await Promise.all([
      guests.getById(ticket.guestId),
      properties.getById(ticket.propertyId),
      conversations.getByTicketId(ticket.id),
    ]);

    if (!guest || !property) {
      console.error('[ticket-notify-worker] guest_or_property_not_found', {
        ticketId: ticket.id,
        guestId: ticket.guestId,
        propertyId: ticket.propertyId,
      });
      return;
    }

    const statusToNotify = ticket.notifyGuestStatus ?? ticket.status;

    // Enviar notificación de estado solo si la flag está activa
    const ticketsEnabled = await featureFlags.isEnabled(
      ticket.propertyId,
      FeatureFlagKeys.NOTIFICATION_TICKET_STATUS_GUEST,
    );
    console.log('[ticket-notify-worker] flag_check', { ticketId: ticket.id, flag: FeatureFlagKeys.NOTIFICATION_TICKET_STATUS_GUEST, enabled: ticketsEnabled });

    if (ticketsEnabled) {
      const lang = resolveLanguage(conversation?.languageDetected ?? guest.preferredLanguage);
      const message = buildMessage(ticket, statusToNotify, lang);

      if (message) {
        const channel = resolveChannel(guest, property);
        console.log('[ticket-notify-worker] sending_message', { ticketId: ticket.id, message });
        await channel.send(message);
        console.log('[ticket-notify-worker] message_sent', { ticketId: ticket.id });
      }
    } else {
      console.log('[ticket-notify-worker] status_notification_skipped', {
        ticketId: ticket.id,
        flag: FeatureFlagKeys.NOTIFICATION_TICKET_STATUS_GUEST,
      });
    }

    // Crear CSAT independientemente de si se envió la notificación de estado.
    // bot_csat_tickets_enabled controla si se envía la encuesta.
    console.log('[ticket-notify-worker] csat_decision', {
      ticketId: ticket.id,
      statusToNotify,
      willAttemptCsat: statusToNotify === 'resolved',
    });

    if (statusToNotify === 'resolved') {
      const csatEnabled = await featureFlags.isEnabled(
        ticket.propertyId,
        FeatureFlagKeys.BOT_CSAT_TICKETS,
      );
      console.log('[ticket-notify-worker] csat_flag_check', { ticketId: ticket.id, flag: FeatureFlagKeys.BOT_CSAT_TICKETS, enabled: csatEnabled });

      if (csatEnabled) {
        console.log('[ticket-notify-worker] csat_creating_survey', {
          ticketId: ticket.id,
          guestId: ticket.guestId,
          conversationId: conversation?.id ?? null,
        });
        const survey = await csatSurveys.create({
          ticketId: ticket.id,
          propertyId: ticket.propertyId,
          organizationId: ticket.organizationId,
          guestId: ticket.guestId,
          conversationId: conversation?.id ?? null,
          surveyTrigger: 'ticket',
        });
        console.log('[ticket-notify-worker] csat_survey_created', {
          ticketId: ticket.id,
          surveyId: survey?.id ?? null,
          success: !!survey,
        });
      } else {
        console.log('[ticket-notify-worker] csat_skipped_flag_disabled', {
          ticketId: ticket.id,
          flag: FeatureFlagKeys.BOT_CSAT_TICKETS,
        });
      }
    } else {
      console.log('[ticket-notify-worker] csat_skipped_not_resolved', {
        ticketId: ticket.id,
        statusToNotify,
      });
    }

    console.log('[ticket-notify-worker] marking_notified', { ticketId: ticket.id });
    await tickets.markNotified(ticket.id);

    console.log('[ticket-notify-worker] notification_sent', {
      ticketId: ticket.id,
      notifyGuestStatus: statusToNotify,
      guest: `${guest.phonePrefix}${guest.phoneNumber}`,
    });
  } catch (err) {
    console.error('[ticket-notify-worker] processing_failed', { ticketId: ticket.id, err });
  }
}

function buildMessage(
  ticket: TicketDto,
  status: string,
  lang: ReturnType<typeof resolveLanguage>,
): string | null {
  switch (status) {
    case 'in_progress':
      return ticketInProgress(ticket, lang);
    case 'resolved':
      return ticketResolved(ticket, lang);
    default:
      return null;
  }
}
