/** Claves estables de feature flags (no cambian entre entornos). */
export const FeatureFlagKeys = {
  BOT_FAQ:            'bot_faq_enabled',
  BOT_CSAT_FAQS:      'bot_csat_faqs_enabled',
  BOT_TICKETS:        'bot_tickets_enabled',
  BOT_CSAT_TICKETS:   'bot_csat_tickets_enabled',
  BOT_MULTILINGUAL:   'bot_multilingual_enabled',
  WHATSAPP_CHANNEL:   'whatsapp_channel_enabled',
  WEB_WIDGET:         'web_widget_enabled',
} as const;

export type FeatureFlagKey = typeof FeatureFlagKeys[keyof typeof FeatureFlagKeys];
