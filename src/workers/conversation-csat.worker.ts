import * as conversations from '../services/conversations/conversation.service';
import { ConversationDto } from '../services/conversations/conversation.schemas';
import * as guests from '../services/guests/guest.service';
import * as properties from '../services/properties/property.service';
import * as featureFlags from '../services/feature-flags/feature-flag.service';
import { FeatureFlagKeys } from '../services/feature-flags/feature-flag.keys';
import { resolveChannel } from '../channels/channel.resolver';
import { conversationCsatQ1 } from '../messages/csat.messages';

/**
 * Ejecuta un ciclo de polling:
 * 1. Obtiene todas las conversaciones con csatRequired=true del backend.
 * 2. Verifica bot_csat_faqs_enabled para la propiedad.
 *    Si está desactivado, omite el envío sin modificar el estado.
 * 3. Por cada una, obtiene en paralelo el guest y las credenciales de la property (cacheadas).
 * 4. Resuelve el canal de notificación y envía el mensaje CSAT.
 * 5. Marca csatRequired=false para no reenviar en el siguiente ciclo.
 *
 * El almacenamiento y seguimiento de la respuesta CSAT lo gestiona otro servicio.
 */
export async function runConversationCsatWorker(): Promise<void> {
  let pending: ConversationDto[];

  try {
    pending = await conversations.getCsatRequired();
  } catch (err) {
    console.error('[conversation-csat-worker] Error obteniendo conversaciones pendientes:', err);
    return;
  }

  if (pending.length === 0) return;

  console.log(`[conversation-csat-worker] ${pending.length} conversación(es) con CSAT pendiente`);

  for (const conversation of pending) {
    await processCsatConversation(conversation);
  }
}

async function processCsatConversation(conversation: ConversationDto): Promise<void> {
  try {
    const enabled = await featureFlags.isEnabled(
      conversation.propertyId,
      FeatureFlagKeys.BOT_CSAT_FAQS,
    );
    if (!enabled) {
      console.log('[conversation-csat-worker] feature_disabled_skip', {
        conversationId: conversation.id,
        flag: FeatureFlagKeys.BOT_CSAT_FAQS,
      });
      return;
    }

    const [guest, property] = await Promise.all([
      guests.getById(conversation.guestId),
      properties.getById(conversation.propertyId),
    ]);

    if (!guest || !property) {
      console.error('[conversation-csat-worker] guest_or_property_not_found', {
        conversationId: conversation.id,
        guestId: conversation.guestId,
        propertyId: conversation.propertyId,
      });
      return;
    }

    const channel = resolveChannel(guest, property);
    await channel.send(conversationCsatQ1());
    await conversations.markCsatSent(conversation.id);

    console.log('[conversation-csat-worker] csat_sent', {
      conversationId: conversation.id,
      propertyId: conversation.propertyId,
      guest: `${guest.phonePrefix}${guest.phoneNumber}`,
    });
  } catch (err) {
    console.error('[conversation-csat-worker] processing_failed', {
      conversationId: conversation.id,
      err,
    });
  }
}
