/** URL paths for the Conversations API. */
export class ConversationEndpoints {
  static readonly BASE = 'conversations';
  static readonly BY_ID = 'conversations/{id}';
  static readonly CSAT_REQUIRED = 'conversations?csatRequired=true';
  static readonly BY_TICKET_ID = 'conversations?ticketId={ticket_id}';
}
