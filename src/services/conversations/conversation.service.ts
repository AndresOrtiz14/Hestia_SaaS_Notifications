/**
 * Conversation operations against the NestJS backend.
 *
 * Usado por el conversation-csat.worker para:
 *   1. getFaqCsatReady()  → conversaciones con faqHitCount>0, csatRequired=false
 *                           y lastActivityAt < NOW() - delaySeconds
 *   2. markCsatSent()     → marcar csatRequired=true tras enviar el mensaje (previene reenvío)
 *
 * Usado por el ticket-notify.worker para:
 *   3. getByTicketId()    → obtener la conversación asociada a un ticket (para leer languageDetected)
 */
import { config } from '../../config';
import { getNestjsClient } from '../nestjs.client';
import { ConversationEndpoints } from './conversation.endpoints';
import { ConversationDto } from './conversation.schemas';

// ── Read ───────────────────────────────────────────────────────────────────────

export async function getFaqCsatReady(): Promise<ConversationDto[]> {
  const client = getNestjsClient();
  const url = ConversationEndpoints.FAQ_CSAT_READY.replace(
    '{delay}',
    String(config.worker.faqSurveyDelaySeconds),
  );
  const data = await client._get<ConversationDto[]>(url);
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
    { csatRequired: true }, // true = ya enviado → el filtro faqCsatReady lo excluye en próximos ciclos
  );
  if (!data) {
    console.error('[conversation-service] mark_csat_sent_failed', { conversationId });
    return null;
  }
  return data;
}
