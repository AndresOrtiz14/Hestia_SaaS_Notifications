/** URL paths for the Conversations API. */
export class ConversationEndpoints {
  static readonly BASE = 'conversations';
  static readonly BY_ID = 'conversations/{id}';
  static readonly BY_TICKET_ID = 'conversations?ticketId={ticket_id}';
  /**
   * Conversaciones listas para recibir CSAT de FAQ:
   *   faqHitCount > 0 AND csatRequired=false AND lastActivityAt < NOW() - delaySeconds
   * El notification-service pasa delaySeconds desde FAQ_SURVEY_DELAY_SECONDS (.env).
   */
  static readonly FAQ_CSAT_READY = 'conversations?faqCsatReady=true&delaySeconds={delay}';
}
