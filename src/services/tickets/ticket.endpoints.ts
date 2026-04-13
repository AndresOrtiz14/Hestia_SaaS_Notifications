/** URL paths for the Tickets API. */
export class TicketEndpoints {
  static readonly BASE = 'tickets';
  static readonly BY_ID = 'tickets/{id}';
  static readonly NOTIFY_GUEST_PENDING = 'tickets?notifyGuestPending=true';
  static readonly ESCALATION_UNASSIGNED = 'tickets?escalation=unassigned';
  static readonly ESCALATION_UNSTARTED  = 'tickets?escalation=unstarted';
}
