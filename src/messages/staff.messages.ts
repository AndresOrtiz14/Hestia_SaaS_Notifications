import { SupportedLanguage } from './ticket.messages';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AREA_NAMES: Record<string, Record<SupportedLanguage, string>> = {
  MAINTENANCE:  { es: 'Mantenimiento',  pt: 'Manutenção',    en: 'Maintenance'  },
  HOUSEKEEPING: { es: 'Housekeeping',   pt: 'Housekeeping',  en: 'Housekeeping' },
  RECEPTION:    { es: 'Recepción',      pt: 'Recepção',      en: 'Reception'    },
  RESTAURANT:   { es: 'Restaurante',    pt: 'Restaurante',   en: 'Restaurant'   },
  MANAGEMENT:   { es: 'Administración', pt: 'Administração', en: 'Management'   },
  AMENITIES:    { es: 'Amenidades',     pt: 'Comodidades',   en: 'Amenities'    },
};

function areaName(areaCode: string, lang: SupportedLanguage): string {
  return AREA_NAMES[areaCode]?.[lang] ?? areaCode;
}

function roomPhrase(roomNumber: string | null, lang: SupportedLanguage): string {
  if (!roomNumber) return '';
  const label = { es: 'hab.', pt: 'qto.', en: 'rm.' }[lang];
  return ` · ${label} ${roomNumber}`;
}

// ── Mensajes ──────────────────────────────────────────────────────────────────

type AssignedPayload = {
  ticketTitle: string;
  areaCode:    string;
  roomNumber:  string | null;
};

export function ticketAssigned(
  payload: AssignedPayload,
  lang: SupportedLanguage = 'es',
): string {
  const area = areaName(payload.areaCode, lang);
  const room = roomPhrase(payload.roomNumber, lang);

  const messages: Record<SupportedLanguage, string> = {
    es: `📋 *Se te asignó un ticket*\n\n*${payload.ticketTitle}*\nÁrea: ${area}${room}\n\nRevisa el panel para ver los detalles.`,
    pt: `📋 *Um ticket foi atribuído a você*\n\n*${payload.ticketTitle}*\nÁrea: ${area}${room}\n\nVerifique o painel para ver os detalhes.`,
    en: `📋 *A ticket was assigned to you*\n\n*${payload.ticketTitle}*\nArea: ${area}${room}\n\nCheck the dashboard for details.`,
  };
  return messages[lang];
}

// ─────────────────────────────────────────────────────────────────────────────

export function ticketReassigned(
  payload: AssignedPayload,
  lang: SupportedLanguage = 'es',
): string {
  const area = areaName(payload.areaCode, lang);
  const room = roomPhrase(payload.roomNumber, lang);

  const messages: Record<SupportedLanguage, string> = {
    es: `🔄 *Ticket reasignado a ti*\n\n*${payload.ticketTitle}*\nÁrea: ${area}${room}\n\nRevisa el panel para ver los detalles.`,
    pt: `🔄 *Ticket reatribuído a você*\n\n*${payload.ticketTitle}*\nÁrea: ${area}${room}\n\nVerifique o painel para ver os detalhes.`,
    en: `🔄 *Ticket reassigned to you*\n\n*${payload.ticketTitle}*\nArea: ${area}${room}\n\nCheck the dashboard for details.`,
  };
  return messages[lang];
}
