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
