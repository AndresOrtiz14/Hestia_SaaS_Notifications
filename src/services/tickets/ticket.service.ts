/**
 * Ticket operations against the NestJS backend.
 *
 * Usado por ticket-notify.worker para:
 *   1. getNotifyGuestPending() → tickets con notifyGuestPending=true y guestId presente
 *   2. markNotified()          → pone notifyGuestPending=false tras enviar el mensaje
 */
import { getNestjsClient } from '../nestjs.client';
import { TicketEndpoints } from './ticket.endpoints';
import { TicketDto } from './ticket.schemas';

// ── Read ───────────────────────────────────────────────────────────────────────

export async function getById(ticketId: string): Promise<TicketDto | null> {
  const client = getNestjsClient();
  return client._get<TicketDto>(TicketEndpoints.BY_ID.replace('{id}', ticketId));
}

export async function getNotifyGuestPending(): Promise<TicketDto[]> {
  const client = getNestjsClient();
  const data = await client._get<TicketDto[]>(TicketEndpoints.NOTIFY_GUEST_PENDING);
  return data ?? [];
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

export async function markNotified(ticketId: string): Promise<TicketDto | null> {
  const client = getNestjsClient();
  const data = await client._put<TicketDto>(
    TicketEndpoints.BY_ID.replace('{id}', ticketId),
    { notifyGuestPending: false },
  );
  if (!data) {
    console.error('[ticket-service] mark_notified_failed', { ticketId });
    return null;
  }
  return data;
}

// ── Escalation ─────────────────────────────────────────────────────────────────

export async function getEscalationUnassigned(): Promise<TicketDto[]> {
  const client = getNestjsClient();
  const data = await client._get<TicketDto[]>(TicketEndpoints.ESCALATION_UNASSIGNED);
  return data ?? [];
}

export async function getEscalationUnstarted(): Promise<TicketDto[]> {
  const client = getNestjsClient();
  const data = await client._get<TicketDto[]>(TicketEndpoints.ESCALATION_UNSTARTED);
  return data ?? [];
}

export async function markUnassignedAlertSent(ticketId: string): Promise<void> {
  const client = getNestjsClient();
  const data = await client._patch<TicketDto>(
    TicketEndpoints.BY_ID.replace('{id}', ticketId),
    { unassignedAlertSentAt: new Date().toISOString() },
  );
  if (!data) {
    console.error('[ticket-service] mark_unassigned_alert_sent_failed', { ticketId });
  }
}

export async function markUnstartedAlertSent(ticketId: string): Promise<void> {
  const client = getNestjsClient();
  const data = await client._patch<TicketDto>(
    TicketEndpoints.BY_ID.replace('{id}', ticketId),
    { unstartedAlertSentAt: new Date().toISOString() },
  );
  if (!data) {
    console.error('[ticket-service] mark_unstarted_alert_sent_failed', { ticketId });
  }
}
