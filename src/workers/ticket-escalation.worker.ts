import * as tickets      from '../services/tickets/ticket.service';
import * as staff        from '../services/staff/staff.service';
import * as properties   from '../services/properties/property.service';
import * as featureFlags from '../services/feature-flags/feature-flag.service';
import { FeatureFlagKeys } from '../services/feature-flags/feature-flag.keys';
import { TicketDto } from '../services/tickets/ticket.schemas';
import { StaffDto } from '../services/staff/staff.schemas';
import { resolveLanguage } from '../messages/ticket.messages';
import {
  ticketEscalationUnassigned,
  ticketEscalationUnstarted,
} from '../messages/supervisor.messages';
import { buildWaNumber, sendWhatsAppMessage } from '../whatsapp/whatsapp.client';

/**
 * Ejecuta un ciclo de escalación de tickets:
 *
 * 1. GET /tickets?escalation=unassigned
 *    → Tickets open sin asignar que superaron ESCALATION_TIMEOUT_MINUTES.
 *    → Envía alerta a los supervisores del área.
 *    → PATCH /tickets/:id { unassignedAlertSentAt: now }
 *
 * 2. GET /tickets?escalation=unstarted
 *    → Tickets assigned sin iniciar que superaron ESCALATION_TIMEOUT_MINUTES.
 *    → Envía alerta al técnico asignado + supervisores del área.
 *    → PATCH /tickets/:id { unstartedAlertSentAt: now }
 *
 * El backend actúa como idempotency guard: una vez marcado el campo *AlertSentAt,
 * el ticket no vuelve a aparecer en el query hasta que cambia de estado.
 */
export async function runTicketEscalationWorker(): Promise<void> {
  await Promise.all([
    runUnassignedEscalation(),
    runUnstartedEscalation(),
  ]);
}

// ── Unassigned ────────────────────────────────────────────────────────────────

async function runUnassignedEscalation(): Promise<void> {
  let pending: TicketDto[];

  try {
    pending = await tickets.getEscalationUnassigned();
    console.log('[escalation-worker] unassigned_fetch', { count: pending.length });
  } catch (err) {
    console.error('[escalation-worker] unassigned_fetch_failed', err);
    return;
  }

  for (const ticket of pending) {
    await processUnassignedEscalation(ticket);
  }
}

async function processUnassignedEscalation(ticket: TicketDto): Promise<void> {
  try {
    const [property, enabled] = await Promise.all([
      properties.getById(ticket.propertyId),
      featureFlags.isEnabled(ticket.propertyId, FeatureFlagKeys.NOTIFICATION_TICKET_ESCALATION_UNASSIGNED),
    ]);

    if (!property) {
      console.warn('[escalation-worker] unassigned_property_not_found', { ticketId: ticket.id });
      return;
    }

    if (!enabled) {
      console.log('[escalation-worker] unassigned_flag_disabled', { ticketId: ticket.id });
      // Mark as sent so we don't re-check this ticket every cycle
      await tickets.markUnassignedAlertSent(ticket.id);
      return;
    }

    if (!property.whatsappWorkersPhoneNumberId || !property.whatsappWorkersCloudToken) {
      console.warn('[escalation-worker] unassigned_workers_whatsapp_not_configured', {
        ticketId:   ticket.id,
        propertyId: ticket.propertyId,
      });
      return;
    }

    const creds = {
      phoneNumberId: property.whatsappWorkersPhoneNumberId,
      cloudToken:    property.whatsappWorkersCloudToken,
    };

    const supervisors = await staff.getSupervisorsByProperty(ticket.propertyId, ticket.areaCode);

    if (supervisors.length === 0) {
      console.warn('[escalation-worker] unassigned_no_supervisors', {
        ticketId:   ticket.id,
        propertyId: ticket.propertyId,
        areaCode:   ticket.areaCode,
      });
    }

    await sendEscalationToRecipients(supervisors, ticket, 'unassigned', creds);

    await tickets.markUnassignedAlertSent(ticket.id);
    console.log('[escalation-worker] unassigned_alert_sent', {
      ticketId:     ticket.id,
      idCode:       ticket.idCode,
      supervisors:  supervisors.length,
    });
  } catch (err) {
    console.error('[escalation-worker] unassigned_processing_failed', { ticketId: ticket.id, err });
  }
}

// ── Unstarted ─────────────────────────────────────────────────────────────────

async function runUnstartedEscalation(): Promise<void> {
  let pending: TicketDto[];

  try {
    pending = await tickets.getEscalationUnstarted();
    console.log('[escalation-worker] unstarted_fetch', { count: pending.length });
  } catch (err) {
    console.error('[escalation-worker] unstarted_fetch_failed', err);
    return;
  }

  for (const ticket of pending) {
    await processUnstartedEscalation(ticket);
  }
}

async function processUnstartedEscalation(ticket: TicketDto): Promise<void> {
  try {
    const [property, enabled] = await Promise.all([
      properties.getById(ticket.propertyId),
      featureFlags.isEnabled(ticket.propertyId, FeatureFlagKeys.NOTIFICATION_TICKET_ESCALATION_UNSTARTED),
    ]);

    if (!property) {
      console.warn('[escalation-worker] unstarted_property_not_found', { ticketId: ticket.id });
      return;
    }

    if (!enabled) {
      console.log('[escalation-worker] unstarted_flag_disabled', { ticketId: ticket.id });
      await tickets.markUnstartedAlertSent(ticket.id);
      return;
    }

    if (!property.whatsappWorkersPhoneNumberId || !property.whatsappWorkersCloudToken) {
      console.warn('[escalation-worker] unstarted_workers_whatsapp_not_configured', {
        ticketId:   ticket.id,
        propertyId: ticket.propertyId,
      });
      return;
    }

    const creds = {
      phoneNumberId: property.whatsappWorkersPhoneNumberId,
      cloudToken:    property.whatsappWorkersCloudToken,
    };

    // Notify the assigned technician + supervisors of the area
    const [supervisors, assignedMember] = await Promise.all([
      staff.getSupervisorsByProperty(ticket.propertyId, ticket.areaCode),
      ticket.assignedToUserId ? staff.getById(ticket.assignedToUserId) : Promise.resolve(null),
    ]);

    const recipients: StaffDto[] = [...supervisors];
    if (assignedMember && !supervisors.some(s => s.id === assignedMember.id)) {
      recipients.push(assignedMember);
    }

    if (recipients.length === 0) {
      console.warn('[escalation-worker] unstarted_no_recipients', {
        ticketId:   ticket.id,
        propertyId: ticket.propertyId,
        areaCode:   ticket.areaCode,
      });
    }

    await sendEscalationToRecipients(recipients, ticket, 'unstarted', creds);

    await tickets.markUnstartedAlertSent(ticket.id);
    console.log('[escalation-worker] unstarted_alert_sent', {
      ticketId:    ticket.id,
      idCode:      ticket.idCode,
      supervisors: supervisors.length,
      assigned:    assignedMember?.id ?? null,
    });
  } catch (err) {
    console.error('[escalation-worker] unstarted_processing_failed', { ticketId: ticket.id, err });
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

async function sendEscalationToRecipients(
  recipients: StaffDto[],
  ticket: TicketDto,
  kind: 'unassigned' | 'unstarted',
  creds: { phoneNumberId: string; cloudToken: string },
): Promise<void> {
  const payload = {
    ticketIdCode: ticket.idCode,
    ticketTitle:  ticket.title,
    areaCode:     ticket.areaCode,
    roomNumber:   ticket.roomNumber,
    priority:     ticket.priority,
  };

  for (const recipient of recipients) {
    if (!recipient.phonePrefix || !recipient.phoneNumber) {
      console.warn('[escalation-worker] recipient_phone_missing', {
        recipientId: recipient.id,
        ticketId:    ticket.id,
      });
      continue;
    }

    const lang    = resolveLanguage(recipient.preferredLanguage);
    const message = kind === 'unassigned'
      ? ticketEscalationUnassigned(payload, lang)
      : ticketEscalationUnstarted(payload, lang);

    const to = buildWaNumber(recipient.phonePrefix, recipient.phoneNumber);

    try {
      await sendWhatsAppMessage(to, message, creds);
      console.log('[escalation-worker] message_sent', {
        kind,
        ticketId:    ticket.id,
        recipientId: recipient.id,
      });
    } catch (err) {
      console.error('[escalation-worker] message_failed', {
        kind,
        ticketId:    ticket.id,
        recipientId: recipient.id,
        err,
      });
    }
  }
}
