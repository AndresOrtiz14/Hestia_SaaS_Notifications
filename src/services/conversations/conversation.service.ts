/**
 * Conversation operations against the NestJS backend.
 *
 * Usado por el conversation-csat.worker para:
 *   1. getCsatRequired()    → obtener conversaciones con csatRequired=true
 *   2. markCsatSent()       → marcar csatRequired=false tras enviar el mensaje
 *
 * Usado por el ticket-notify.worker para:
 *   3. getByTicketId()      → obtener la conversación asociada a un ticket (para leer languageDetected)
 */
import { getNestjsClient } from '../nestjs.client';
import { ConversationEndpoints } from './conversation.endpoints';
import { ConversationDto } from './conversation.schemas';

// ── Read ───────────────────────────────────────────────────────────────────────

export async function getCsatRequired(): Promise<ConversationDto[]> {
  const client = getNestjsClient();
  const data = await client._get<ConversationDto[]>(ConversationEndpoints.CSAT_REQUIRED);
  return data ?? [];
}

export async function getByTicketId(ticketId: string): Promise<ConversationDto | null> {
  const client = getNestjsClient();
  const data = await client._get<ConversationDto[]>(
    ConversationEndpoints.BY_TICKET_ID.replace('{ticket_id}', ticketId),
  );
  if (!data || data.length === 0) return null;
  // Retorna la más reciente por lastActivityAt
  return data.sort((a, b) => (a.lastActivityAt > b.lastActivityAt ? -1 : 1))[0];
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

export async function markCsatSent(conversationId: string): Promise<ConversationDto | null> {
  const client = getNestjsClient();
  const data = await client._put<ConversationDto>(
    ConversationEndpoints.BY_ID.replace('{id}', conversationId),
    { csatRequired: false },
  );
  if (!data) {
    console.error('[conversation-service] mark_csat_sent_failed', { conversationId });
    return null;
  }
  return data;
}
