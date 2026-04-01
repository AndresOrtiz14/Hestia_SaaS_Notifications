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

type CreatedFromGuestPayload = {
  ticketTitle: string;
  areaCode:    string;
  roomNumber:  string | null;
  guestName:   string | null;
};

export function ticketCreatedFromGuest(
  payload: CreatedFromGuestPayload,
  lang: SupportedLanguage = 'es',
): string {
  const area = areaName(payload.areaCode, lang);
  const room = roomPhrase(payload.roomNumber, lang);
  const guest = payload.guestName ?? { es: 'un huésped', pt: 'um hóspede', en: 'a guest' }[lang];

  const messages: Record<SupportedLanguage, string> = {
    es: `🔔 *Ticket nuevo*\n\n*${payload.ticketTitle}*\nÁrea: ${area}${room}\nCreado por: ${guest}`,
    pt: `🔔 *Novo ticket*\n\n*${payload.ticketTitle}*\nÁrea: ${area}${room}\nCriado por: ${guest}`,
    en: `🔔 *New ticket*\n\n*${payload.ticketTitle}*\nArea: ${area}${room}\nCreated by: ${guest}`,
  };
  return messages[lang];
}

// ─────────────────────────────────────────────────────────────────────────────

type CompletedPayload = {
  ticketTitle:     string;
  areaCode:        string;
  roomNumber:      string | null;
  resolvedByName:  string | null;
};

export function ticketCompleted(
  payload: CompletedPayload,
  lang: SupportedLanguage = 'es',
): string {
  const area = areaName(payload.areaCode, lang);
  const room = roomPhrase(payload.roomNumber, lang);
  const by   = payload.resolvedByName
    ? { es: `por ${payload.resolvedByName}`, pt: `por ${payload.resolvedByName}`, en: `by ${payload.resolvedByName}` }[lang]
    : { es: 'por el equipo',                pt: 'pela equipe',                   en: 'by the team' }[lang];

  const messages: Record<SupportedLanguage, string> = {
    es: `✅ *Ticket resuelto*\n\n*${payload.ticketTitle}*\nÁrea: ${area}${room}\nResuelto ${by}`,
    pt: `✅ *Ticket resolvido*\n\n*${payload.ticketTitle}*\nÁrea: ${area}${room}\nResolvido ${by}`,
    en: `✅ *Ticket resolved*\n\n*${payload.ticketTitle}*\nArea: ${area}${room}\nResolved ${by}`,
  };
  return messages[lang];
}

// ─────────────────────────────────────────────────────────────────────────────

type ReassignedPayload = {
  ticketTitle:        string;
  areaCode:           string;
  roomNumber:         string | null;
  newStaffName:       string | null;
  previousStaffName:  string | null;
};

export function ticketReassigned(
  payload: ReassignedPayload,
  lang: SupportedLanguage = 'es',
): string {
  const area     = areaName(payload.areaCode, lang);
  const room     = roomPhrase(payload.roomNumber, lang);
  const newStaff = payload.newStaffName      ?? { es: 'nuevo agente',   pt: 'novo agente',   en: 'new agent' }[lang];
  const prevStaff = payload.previousStaffName ?? { es: 'agente anterior', pt: 'agente anterior', en: 'previous agent' }[lang];

  const messages: Record<SupportedLanguage, string> = {
    es: `🔄 *Ticket reasignado*\n\n*${payload.ticketTitle}*\nÁrea: ${area}${room}\nAntes: ${prevStaff}\nAhora: ${newStaff}`,
    pt: `🔄 *Ticket reatribuído*\n\n*${payload.ticketTitle}*\nÁrea: ${area}${room}\nAntes: ${prevStaff}\nAgora: ${newStaff}`,
    en: `🔄 *Ticket reassigned*\n\n*${payload.ticketTitle}*\nArea: ${area}${room}\nBefore: ${prevStaff}\nNow: ${newStaff}`,
  };
  return messages[lang];
}
