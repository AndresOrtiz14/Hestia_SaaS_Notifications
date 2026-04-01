import * as morningService from '../services/morning-reminder/morning-reminder.service';
import * as properties     from '../services/properties/property.service';
import { buildWaNumber, sendWhatsAppMessage, WaCredentials } from '../whatsapp/whatsapp.client';
import { resolveLanguage } from '../messages/ticket.messages';
import { morningReminderStaff, morningReminderSupervisor } from '../messages/morning-reminder.messages';
import { StaffWithTicketsDto, SupervisorWithSummaryDto } from '../services/morning-reminder/morning-reminder.schemas';

/**
 * Cron del morning reminder. Se ejecuta cada minuto desde main.ts.
 *
 * Por cada propiedad activa:
 *   1. Calcula si el momento actual coincide con workingHoursStart en la
 *      timezone del hotel (match exacto por minuto).
 *   2. Si es hora y no se envió ya hoy para esa propiedad: obtiene staff
 *      y supervisores, envía un WhatsApp a cada uno.
 *
 * Idempotencia: `_sentToday` registra las propiedades que ya recibieron el
 * reminder en el día actual (clave: `propertyId:YYYY-MM-DD`). Esto previene
 * mensajes duplicados si el servicio se reinicia en el mismo minuto de
 * workingHoursStart. El Set se limpia automáticamente al cambiar de día.
 */

const _sentToday = new Set<string>();

function sentTodayKey(propertyId: string, now: Date): string {
  return `${propertyId}:${now.toISOString().slice(0, 10)}`;
}

export async function runMorningReminderWorker(): Promise<void> {
  let activeProperties: Awaited<ReturnType<typeof morningService.getActiveProperties>>;

  try {
    activeProperties = await morningService.getActiveProperties();
  } catch (err) {
    console.error('[morning-reminder-worker] Error obteniendo propiedades activas:', err);
    return;
  }

  if (activeProperties.length === 0) return;

  const now = new Date();

  for (const prop of activeProperties) {
    try {
      if (!isReminderWindow(now, prop.workingHoursStart, prop.timezone)) continue;

      const key = sentTodayKey(prop.id, now);
      if (_sentToday.has(key)) continue;
      _sentToday.add(key);

      const property = await properties.getById(prop.id);
      if (!property?.whatsappPhoneNumberId || !property.whatsappCloudToken) {
        console.warn('[morning-reminder-worker] whatsapp_not_configured', { propertyId: prop.id });
        continue;
      }

      const creds: WaCredentials = {
        phoneNumberId: property.whatsappPhoneNumberId,
        cloudToken:    property.whatsappCloudToken,
      };

      const [staffList, supervisorList] = await Promise.all([
        morningService.getStaffWithTickets(prop.id),
        morningService.getSupervisorsWithSummary(prop.id),
      ]);

      await sendStaffReminders(staffList, creds, prop.id);
      await sendSupervisorReminders(supervisorList, creds, prop.id);

    } catch (err) {
      console.error('[morning-reminder-worker] property_processing_failed', { propertyId: prop.id, err });
    }
  }
}

// ── Envíos por tipo de destinatario ──────────────────────────────────────────

async function sendStaffReminders(
  staffList: StaffWithTicketsDto[],
  creds:     WaCredentials,
  propertyId: string,
): Promise<void> {
  for (const member of staffList) {
    if (!member.phonePrefix || !member.phoneNumber) continue;
    try {
      const lang    = resolveLanguage(member.preferredLanguage);
      const message = morningReminderStaff(
        { recipientName: member.name, openTickets: member.openTickets },
        lang,
      );
      await sendWhatsAppMessage(buildWaNumber(member.phonePrefix, member.phoneNumber), message, creds);
      console.log('[morning-reminder-worker] staff_sent', { propertyId, staffId: member.id });
    } catch (err) {
      console.error('[morning-reminder-worker] staff_send_failed', { propertyId, staffId: member.id, err });
    }
  }
}

async function sendSupervisorReminders(
  supervisorList: SupervisorWithSummaryDto[],
  creds:          WaCredentials,
  propertyId:     string,
): Promise<void> {
  for (const supervisor of supervisorList) {
    if (!supervisor.phonePrefix || !supervisor.phoneNumber) continue;
    try {
      const lang    = resolveLanguage(supervisor.preferredLanguage);
      const message = morningReminderSupervisor(
        { recipientName: supervisor.name, summary: supervisor.summary },
        lang,
      );
      await sendWhatsAppMessage(buildWaNumber(supervisor.phonePrefix, supervisor.phoneNumber), message, creds);
      console.log('[morning-reminder-worker] supervisor_sent', { propertyId, supervisorId: supervisor.id });
    } catch (err) {
      console.error('[morning-reminder-worker] supervisor_send_failed', { propertyId, supervisorId: supervisor.id, err });
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isReminderWindow(now: Date, workingHoursStart: string, timezone: string): boolean {
  try {
    const [targetH, targetM] = workingHoursStart.split(':').map(Number);

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour:     '2-digit',
      minute:   '2-digit',
      hour12:   false,
    });

    const parts  = formatter.formatToParts(now);
    const localH = Number(parts.find(p => p.type === 'hour')?.value   ?? 0);
    const localM = Number(parts.find(p => p.type === 'minute')?.value ?? 0);

    return localH * 60 + localM === targetH * 60 + targetM;
  } catch {
    console.error('[morning-reminder-worker] invalid_timezone', { timezone });
    return false;
  }
}
