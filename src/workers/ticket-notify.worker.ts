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
  ticketAssigned,
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
  } catch (err) {
    console.error('[ticket-notify-worker] Error obteniendo tickets pendientes:', err);
    return;
  }

  if (pending.length === 0) return;

  console.log(`[ticket-notify-worker] ${pending.length} ticket(s) con notificación pendiente`);

  for (const ticket of pending) {
    await processTicketNotification(ticket);
  }
}

async function processTicketNotification(ticket: TicketDto): Promise<void> {
  try {
    const ticketsEnabled = await featureFlags.isEnabled(
      ticket.propertyId,
      FeatureFlagKeys.NOTIFICATION_TICKET_STATUS_GUEST,
    );
    if (!ticketsEnabled) {
      console.log('[ticket-notify-worker] feature_disabled_skip', {
        ticketId: ticket.id,
        flag: FeatureFlagKeys.NOTIFICATION_TICKET_STATUS_GUEST,
      });
      return;
    }

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

    const lang = resolveLanguage(conversation?.languageDetected ?? guest.preferredLanguage);

    // Usar notifyGuestStatus (estado que disparó la notificación) en lugar de
    // ticket.status, que puede haber cambiado entre que se marcó el flag y ahora.
    const statusToNotify = ticket.notifyGuestStatus ?? ticket.status;
    const message = buildMessage(ticket, statusToNotify, lang);

    if (!message) {
      // Estado no notificable — limpiar el flag
      await tickets.markNotified(ticket.id);
      return;
    }

    const channel = resolveChannel(guest, property);
    await channel.send(message);

    // Si el ticket fue resuelto y el hotel tiene CSAT de tickets habilitado,
    // crear el survey pending para que csat.worker lo envíe en el próximo ciclo.
    if (statusToNotify === 'resolved') {
      const csatEnabled = await featureFlags.isEnabled(
        ticket.propertyId,
        FeatureFlagKeys.BOT_CSAT_TICKETS,
      );
      if (csatEnabled) {
        await csatSurveys.create({
          ticketId: ticket.id,
          propertyId: ticket.propertyId,
          organizationId: ticket.organizationId,
          guestId: ticket.guestId,
          conversationId: conversation?.id ?? null,
          surveyTrigger: 'ticket',
        });
        console.log('[ticket-notify-worker] csat_survey_created', { ticketId: ticket.id });
      }
    }

    await tickets.markNotified(ticket.id);

    console.log('[ticket-notify-worker] notification_sent', {
      ticketId: ticket.id,
      notifyGuestStatus: statusToNotify,
      lang,
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
    case 'assigned':
      return ticketAssigned(ticket, lang);
    case 'in_progress':
      return ticketInProgress(ticket, lang);
    case 'resolved':
      return ticketResolved(ticket, lang);
    default:
      return null;
  }
}
