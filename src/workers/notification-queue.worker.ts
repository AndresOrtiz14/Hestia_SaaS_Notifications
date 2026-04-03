import * as queue       from '../services/notification-queue/notification-queue.service';
import * as featureFlags from '../services/feature-flags/feature-flag.service';
import * as properties   from '../services/properties/property.service';
import * as staff        from '../services/staff/staff.service';
import * as guests       from '../services/guests/guest.service';
import { getFlagForEntry } from '../services/notification-queue/flag-map';
import { NotificationQueueEntryDto } from '../services/notification-queue/notification-queue.schemas';
import { resolveLanguage } from '../messages/ticket.messages';
import * as supervisorMsg from '../messages/supervisor.messages';
import { buildWaNumber, sendWhatsAppMessage } from '../whatsapp/whatsapp.client';

/**
 * Ejecuta un ciclo de polling:
 * 1. Obtiene hasta 50 entradas pendientes de notification_queue.
 * 2. Por cada entrada verifica el feature flag de la propiedad.
 * 3. Obtiene teléfono del destinatario (staff, supervisor o guest).
 * 4. Construye el mensaje según el tipo de evento.
 * 5. Envía el mensaje por WhatsApp.
 * 6. Marca la entrada como sent o failed (la lógica de reintentos vive en el backend).
 */
export async function runNotificationQueueWorker(): Promise<void> {
  let pending: NotificationQueueEntryDto[];

  try {
    pending = await queue.getPending();
  } catch (err) {
    console.error('[notification-queue-worker] Error obteniendo entradas pendientes:', err);
    return;
  }

  if (pending.length === 0) return;

  console.log(`[notification-queue-worker] ${pending.length} entrada(s) pendiente(s)`);

  for (const entry of pending) {
    await processEntry(entry);
  }
}

async function processEntry(entry: NotificationQueueEntryDto): Promise<void> {
  try {
    // ── 1. Verificar feature flag ────────────────────────────────────────────
    const flagKey = getFlagForEntry(entry.type);
    if (flagKey) {
      const enabled = await featureFlags.isEnabled(entry.propertyId, flagKey);
      if (!enabled) {
        console.log('[notification-queue-worker] feature_disabled_skip', {
          entryId: entry.id,
          type:    entry.type,
          flag:    flagKey,
        });
        // Descartar: el hotel desactivó esta notificación
        await queue.markSent(entry.id);
        return;
      }
    }

    // ── 2. Obtener property y seleccionar credenciales WhatsApp ─────────────
    // Guests  → bot de huéspedes  (whatsappPhoneNumberId)
    // Staff/supervisor → bot de personal interno (staffWhatsappPhoneNumberId)
    const property = await properties.getById(entry.propertyId);
    if (!property) {
      await queue.markFailed(entry.id, 'property_not_found');
      return;
    }

    const isInternalRecipient = entry.recipientType === 'staff' || entry.recipientType === 'supervisor';

    const phoneNumberId = isInternalRecipient
      ? property.whatsappWorkersPhoneNumberId
      : property.whatsappPhoneNumberId;
    const cloudToken = isInternalRecipient
      ? property.whatsappWorkersCloudToken
      : property.whatsappCloudToken;

    if (!phoneNumberId || !cloudToken) {
      const reason = isInternalRecipient ? 'whatsapp_workers_not_configured' : 'whatsapp_not_configured';
      await queue.markFailed(entry.id, reason);
      return;
    }

    const creds = { phoneNumberId, cloudToken };

    // ── 3. Obtener teléfono del destinatario y construir mensaje ─────────────
    let to:      string;
    let message: string;

    if (entry.recipientType === 'guest') {
      const guest = await guests.getById(entry.recipientId);
      if (!guest) {
        await queue.markFailed(entry.id, 'guest_not_found');
        return;
      }
      to      = buildWaNumber(guest.phonePrefix, guest.phoneNumber);
      message = buildBroadcastMessage(entry.payload);

    } else {
      // staff o supervisor
      const member = await staff.getById(entry.recipientId);
      if (!member) {
        await queue.markFailed(entry.id, 'staff_not_found');
        return;
      }
      if (!member.phonePrefix || !member.phoneNumber) {
        await queue.markFailed(entry.id, 'staff_phone_missing');
        return;
      }
      to = buildWaNumber(member.phonePrefix, member.phoneNumber);

      const lang = resolveLanguage(member.preferredLanguage);
      message = await buildInternalMessage(entry, lang);
    }

    // ── 4. Enviar ────────────────────────────────────────────────────────────
    await sendWhatsAppMessage(to, message, creds);

    await queue.markSent(entry.id);
    console.log('[notification-queue-worker] sent', {
      entryId:       entry.id,
      type:          entry.type,
      recipientType: entry.recipientType,
      recipientId:   entry.recipientId,
    });

  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[notification-queue-worker] processing_failed', {
      entryId: entry.id,
      type:    entry.type,
      error,
    });
    await queue.markFailed(entry.id, error).catch(() => undefined);
  }
}

// ── Builders de mensaje ───────────────────────────────────────────────────────

function buildBroadcastMessage(payload: Record<string, unknown>): string {
  return String(payload.message ?? '');
}

async function buildInternalMessage(
  entry: NotificationQueueEntryDto,
  lang:  ReturnType<typeof resolveLanguage>,
): Promise<string> {
  const p = entry.payload;

  switch (entry.type) {
    case 'ticket.created.fromguest':
      return supervisorMsg.ticketCreatedFromGuest(
        {
          ticketTitle: String(p.ticketTitle ?? ''),
          areaCode:    String(p.areaCode    ?? ''),
          roomNumber:  (p.roomNumber as string | null) ?? null,
          guestName:   (p.guestName  as string | null) ?? null,
        },
        lang,
      );

    default:
      throw new Error(`Unknown notification type: ${entry.type}`);
  }
}
