/** URL paths for the Morning Reminder API. */
export class MorningReminderEndpoints {
  static readonly ACTIVE_PROPERTIES          = 'properties/morning-reminder-active';
  static readonly STAFF_WITH_TICKETS         = 'properties/{id}/staff/active-with-tickets';
  static readonly SUPERVISORS_WITH_SUMMARY   = 'properties/{id}/supervisors/active-with-summary';
}
