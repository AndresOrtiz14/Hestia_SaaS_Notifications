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

const AREA_ABBR: Record<string, string> = {
  MAINTENANCE:  'MT',
  HOUSEKEEPING: 'HK',
  RECEPTION:    'RC',
  RESTAURANT:   'RS',
  MANAGEMENT:   'MG',
  AMENITIES:    'AM',
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

type CreatedFromGuestPayload = {
  ticketTitle:   string;
  ticketIdCode?: number | null;
  areaCode:      string;
  roomNumber:    string | null;
  guestName:     string | null;
};

export function ticketCreatedFromGuest(
  payload: CreatedFromGuestPayload,
  lang: SupportedLanguage = 'es',
): string {
  const area  = areaName(payload.areaCode, lang);
  const abbr  = AREA_ABBR[payload.areaCode] ?? payload.areaCode;
  const room  = roomPhrase(payload.roomNumber, lang);
  const guest = payload.guestName ?? { es: 'un huésped', pt: 'um hóspede', en: 'a guest' }[lang];
  const idTag = payload.ticketIdCode != null ? ` #${payload.ticketIdCode}` : '';

  const header: Record<SupportedLanguage, string> = {
    es: `Nuevo ticket${idTag} · ${abbr}`,
    pt: `Novo ticket${idTag} · ${abbr}`,
    en: `New ticket${idTag} · ${abbr}`,
  };

  const messages: Record<SupportedLanguage, string> = {
    es: `🔔 *${header.es}*\n\n*${payload.ticketTitle}*\nÁrea: ${area}${room}\nCreado por: ${guest}`,
    pt: `🔔 *${header.pt}*\n\n*${payload.ticketTitle}*\nÁrea: ${area}${room}\nCriado por: ${guest}`,
    en: `🔔 *${header.en}*\n\n*${payload.ticketTitle}*\nArea: ${area}${room}\nCreated by: ${guest}`,
  };
  return messages[lang];
}
