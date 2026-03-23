export type SupportedLanguage = 'es' | 'pt' | 'en';

export function resolveLanguage(lang: string | null | undefined): SupportedLanguage {
  if (lang === 'pt' || lang === 'en') return lang;
  return 'es';
}

// ── Actor de área (frase completa, lista para insertar en el mensaje) ─────────

const AREA_NAMES: Record<string, Record<SupportedLanguage, string>> = {
  MAINTENANCE:  { es: 'Mantenimiento',  pt: 'Manutenção',    en: 'Maintenance'    },
  HOUSEKEEPING: { es: 'Housekeeping',   pt: 'Housekeeping',  en: 'Housekeeping'   },
  RECEPTION:    { es: 'Recepción',      pt: 'Recepção',      en: 'Reception'      },
  RESTAURANT:   { es: 'Restaurante',    pt: 'Restaurante',   en: 'Restaurant'     },
  MANAGEMENT:   { es: 'Administración', pt: 'Administração', en: 'Management'     },
  AMENITIES:    { es: 'Amenidades',     pt: 'Comodidades',   en: 'Amenities'      },
};

const GENERAL_ACTOR: Record<SupportedLanguage, string> = {
  es: 'el equipo del hotel',
  pt: 'a equipe do hotel',
  en: 'the hotel team',
};

function areaActor(areaCode: string, lang: SupportedLanguage): string {
  if (areaCode === 'GENERAL') return GENERAL_ACTOR[lang];
  const name = AREA_NAMES[areaCode]?.[lang] ?? areaCode;
  const prefix = { es: 'el equipo de ', pt: 'a equipe de ', en: 'the ' }[lang];
  const suffix = { es: '',              pt: '',             en: ' team' }[lang];
  return `${prefix}${name}${suffix}`;
}

function roomPhrase(roomNumber: string | null, lang: SupportedLanguage): string {
  if (!roomNumber) return '';
  const label = { es: 'habitación', pt: 'quarto', en: 'room' }[lang];
  return ` (${label} ${roomNumber})`;
}

// ── Mensajes de cambio de estado ──────────────────────────────────────────────

type TicketContext = { title: string; areaCode: string; roomNumber: string | null };

export function ticketInProgress(ticket: TicketContext, lang: SupportedLanguage = 'es'): string {
  const actor = areaActor(ticket.areaCode, lang);
  const room  = roomPhrase(ticket.roomNumber, lang);

  const messages: Record<SupportedLanguage, string> = {
    es: (
      `🔧 *Estamos en ello*\n\n` +
      `Tu solicitud *"${ticket.title}"*${room} ya está siendo atendida por ${actor}.\n\n` +
      `Te avisaremos cuando esté resuelta.`
    ),
    pt: (
      `🔧 *Estamos a tratar disso*\n\n` +
      `O seu pedido *"${ticket.title}"*${room} já está sendo atendido por ${actor}.\n\n` +
      `Avisaremos quando estiver resolvido.`
    ),
    en: (
      `🔧 *We're on it*\n\n` +
      `Your request *"${ticket.title}"*${room} is now being handled by ${actor}.\n\n` +
      `We'll let you know when it's resolved.`
    ),
  };

  return messages[lang];
}

export function ticketResolved(ticket: TicketContext, lang: SupportedLanguage = 'es'): string {
  const actor = areaActor(ticket.areaCode, lang);
  const room  = roomPhrase(ticket.roomNumber, lang);

  const messages: Record<SupportedLanguage, string> = {
    es: (
      `✅ *Solicitud resuelta*\n\n` +
      `Tu solicitud *"${ticket.title}"*${room} ha sido resuelta por ${actor}.\n\n` +
      `Esperamos haber sido de ayuda. Si necesitas algo más, escríbenos cuando quieras. 😊`
    ),
    pt: (
      `✅ *Pedido resolvido*\n\n` +
      `O seu pedido *"${ticket.title}"*${room} foi resolvido por ${actor}.\n\n` +
      `Esperamos ter ajudado. Se precisar de algo mais, escreva-nos quando quiser. 😊`
    ),
    en: (
      `✅ *Request resolved*\n\n` +
      `Your request *"${ticket.title}"*${room} has been resolved by ${actor}.\n\n` +
      `We hope we were helpful. If you need anything else, feel free to write to us. 😊`
    ),
  };

  return messages[lang];
}
