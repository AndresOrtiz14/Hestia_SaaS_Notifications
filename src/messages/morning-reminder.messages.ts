import { SupportedLanguage } from './ticket.messages';

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

// ── Staff: lista de sus tickets abiertos ─────────────────────────────────────

type OpenTicket = {
  title:      string;
  areaCode:   string;
  roomNumber: string | null;
};

type StaffReminderPayload = {
  recipientName: string;
  openTickets:   OpenTicket[];
};

export function morningReminderStaff(
  payload: StaffReminderPayload,
  lang: SupportedLanguage = 'es',
): string {
  const { recipientName, openTickets } = payload;

  const greetings: Record<SupportedLanguage, string> = {
    es: `🌅 Buenos días, *${recipientName}*\n\nTienes *${openTickets.length}* ticket(s) pendiente(s):`,
    pt: `🌅 Bom dia, *${recipientName}*\n\nVocê tem *${openTickets.length}* ticket(s) pendente(s):`,
    en: `🌅 Good morning, *${recipientName}*\n\nYou have *${openTickets.length}* pending ticket(s):`,
  };

  const lines = openTickets.map((t, i) => {
    const area = areaName(t.areaCode, lang);
    const room = t.roomNumber
      ? ` · ${{ es: 'hab.', pt: 'qto.', en: 'rm.' }[lang]} ${t.roomNumber}`
      : '';
    return `${i + 1}. *${t.title}* — ${area}${room}`;
  });

  return [greetings[lang], ...lines].join('\n');
}

// ── Supervisor: resumen por área ─────────────────────────────────────────────

type AreaSummary = {
  area:        string;
  count:       number;
  oldestHours: number;
};

type SupervisorReminderPayload = {
  recipientName: string;
  summary: {
    total:   number;
    byArea:  AreaSummary[];
    overdue: number;
  };
};

export function morningReminderSupervisor(
  payload: SupervisorReminderPayload,
  lang: SupportedLanguage = 'es',
): string {
  const { recipientName, summary } = payload;

  const greetings: Record<SupportedLanguage, string> = {
    es: `🌅 Buenos días, *${recipientName}*\n\nResumen de tickets abiertos: *${summary.total}* en total`,
    pt: `🌅 Bom dia, *${recipientName}*\n\nResumo de tickets abertos: *${summary.total}* no total`,
    en: `🌅 Good morning, *${recipientName}*\n\nOpen tickets summary: *${summary.total}* total`,
  };

  const areaLines = summary.byArea.map((a) => {
    const name = areaName(a.area, lang);
    const oldestLabel: Record<SupportedLanguage, string> = {
      es: `más antiguo: ${a.oldestHours}h`,
      pt: `mais antigo: ${a.oldestHours}h`,
      en: `oldest: ${a.oldestHours}h`,
    };
    return `• ${name}: *${a.count}* (${oldestLabel[lang]})`;
  });

  const overdueLabel: Record<SupportedLanguage, string> = {
    es: `⚠️ Vencidos (+24h): *${summary.overdue}*`,
    pt: `⚠️ Vencidos (+24h): *${summary.overdue}*`,
    en: `⚠️ Overdue (+24h): *${summary.overdue}*`,
  };

  return [greetings[lang], ...areaLines, overdueLabel[lang]].join('\n');
}
