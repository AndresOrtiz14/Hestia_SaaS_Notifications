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
  ticketTitle:       string;
  ticketDescription: string | null;
  ticketIdCode?:     number | null;
  areaCode:          string;
  roomNumber:        string | null;
  guestName:         string | null;
};

// ── Escalation messages ───────────────────────────────────────────────────────

type EscalationPayload = {
  ticketIdCode:  number;
  ticketTitle:   string;
  areaCode:      string;
  roomNumber:    string | null;
  priority:      string;
};

const PRIORITY_LABEL: Record<string, Record<SupportedLanguage, string>> = {
  low:      { es: 'baja',     pt: 'baixa',   en: 'low'      },
  medium:   { es: 'media',    pt: 'média',   en: 'medium'   },
  high:     { es: 'alta',     pt: 'alta',    en: 'high'     },
  critical: { es: 'crítica',  pt: 'crítica', en: 'critical' },
};

function priorityLabel(priority: string, lang: SupportedLanguage): string {
  return PRIORITY_LABEL[priority]?.[lang] ?? priority;
}

/**
 * Alerta a supervisores: ticket abierto sin asignar que superó el timeout.
 */
export function ticketEscalationUnassigned(
  payload: EscalationPayload,
  lang: SupportedLanguage = 'es',
): string {
  const area  = areaName(payload.areaCode, lang);
  const abbr  = AREA_ABBR[payload.areaCode] ?? payload.areaCode;
  const room  = roomPhrase(payload.roomNumber, lang);
  const prio  = priorityLabel(payload.priority, lang);

  const messages: Record<SupportedLanguage, string> = {
    es: (
      `⚠️ *Ticket sin asignar · #${payload.ticketIdCode} · ${abbr}*\n` +
      `📋 ${payload.ticketTitle}${room}\n` +
      `🏠 Área: ${area} · Prioridad: ${prio}\n\n` +
      `Este ticket lleva demasiado tiempo sin ser asignado.`
    ),
    pt: (
      `⚠️ *Ticket sem atribuir · #${payload.ticketIdCode} · ${abbr}*\n` +
      `📋 ${payload.ticketTitle}${room}\n` +
      `🏠 Área: ${area} · Prioridade: ${prio}\n\n` +
      `Este ticket está há muito tempo sem ser atribuído.`
    ),
    en: (
      `⚠️ *Unassigned ticket · #${payload.ticketIdCode} · ${abbr}*\n` +
      `📋 ${payload.ticketTitle}${room}\n` +
      `🏠 Area: ${area} · Priority: ${prio}\n\n` +
      `This ticket has been waiting too long to be assigned.`
    ),
  };
  return messages[lang];
}

/**
 * Alerta a supervisores y al técnico asignado: ticket asignado sin iniciar que superó el timeout.
 */
export function ticketEscalationUnstarted(
  payload: EscalationPayload,
  lang: SupportedLanguage = 'es',
): string {
  const area  = areaName(payload.areaCode, lang);
  const abbr  = AREA_ABBR[payload.areaCode] ?? payload.areaCode;
  const room  = roomPhrase(payload.roomNumber, lang);
  const prio  = priorityLabel(payload.priority, lang);

  const messages: Record<SupportedLanguage, string> = {
    es: (
      `⏱️ *Ticket sin iniciar · #${payload.ticketIdCode} · ${abbr}*\n` +
      `📋 ${payload.ticketTitle}${room}\n` +
      `🏠 Área: ${area} · Prioridad: ${prio}\n\n` +
      `Este ticket fue asignado pero lleva demasiado tiempo sin iniciarse.`
    ),
    pt: (
      `⏱️ *Ticket não iniciado · #${payload.ticketIdCode} · ${abbr}*\n` +
      `📋 ${payload.ticketTitle}${room}\n` +
      `🏠 Área: ${area} · Prioridade: ${prio}\n\n` +
      `Este ticket foi atribuído mas está há muito tempo sem ser iniciado.`
    ),
    en: (
      `⏱️ *Unstarted ticket · #${payload.ticketIdCode} · ${abbr}*\n` +
      `📋 ${payload.ticketTitle}${room}\n` +
      `🏠 Area: ${area} · Priority: ${prio}\n\n` +
      `This ticket was assigned but has not been started in too long.`
    ),
  };
  return messages[lang];
}

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

  const desc = payload.ticketDescription ?? payload.ticketTitle;

  const messages: Record<SupportedLanguage, string> = {
    es: `🔔 *${header.es}*\n📋 ${desc}\n🏠 Área: ${area}${room}\n👤 Creado por: ${guest}`,
    pt: `🔔 *${header.pt}*\n📋 ${desc}\n🏠 Área: ${area}${room}\n👤 Criado por: ${guest}`,
    en: `🔔 *${header.en}*\n📋 ${desc}\n🏠 Area: ${area}${room}\n👤 Created by: ${guest}`,
  };
  return messages[lang];
}
