/** Claves estables de feature flags (no cambian entre entornos). */
export const FeatureFlagKeys = {
  // ── Bot / AI ──────────────────────────────────────────────────────────────
  BOT_FAQ:                                          'bot_faq_enabled',
  BOT_MULTILINGUAL:                                 'bot_multilingual_enabled',
  BOT_TICKETS:                                      'bot_tickets_enabled',
  BOT_WORKERS:                                      'bot_workers_enabled',
  BOT_OUT_OF_HOURS:                                 'bot_out_of_hours_enabled',
  BOT_CSAT_TICKETS:                                 'bot_csat_tickets_enabled',
  BOT_CSAT_FAQS:                                    'bot_csat_faqs_enabled',

  // ── Canales ───────────────────────────────────────────────────────────────
  WHATSAPP_CHANNEL:                                 'whatsapp_channel_enabled',
  WEB_WIDGET:                                       'web_widget_enabled',

  // ── Notificaciones al huésped ─────────────────────────────────────────────
  NOTIFICATION_TICKET_STATUS_GUEST:                 'notification_ticket_status_guest_enabled',

  // ── Notificaciones al personal interno ────────────────────────────────────
  NOTIFICATION_TICKET_CREATED_FROM_GUEST_TO_SUPERVISOR: 'notification_ticket_created_from_guest_to_supervisor_enabled',
  NOTIFICATION_MORNING_REMINDER:                    'notification_morning_reminder_enabled',

  // ── Campañas y broadcast ──────────────────────────────────────────────────
  NOTIFICATION_BROADCAST:                           'notification_broadcast_enabled',
} as const;

export type FeatureFlagKey = typeof FeatureFlagKeys[keyof typeof FeatureFlagKeys];
