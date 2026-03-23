import * as conversations from '../services/conversations/conversation.service';
import * as csatSurveys from '../services/csat-surveys/csat-survey.service';
import { ConversationDto } from '../services/conversations/conversation.schemas';
import * as guests from '../services/guests/guest.service';
import * as properties from '../services/properties/property.service';
import * as featureFlags from '../services/feature-flags/feature-flag.service';
import { FeatureFlagKeys } from '../services/feature-flags/feature-flag.keys';
import { resolveChannel } from '../channels/channel.resolver';
import { conversationCsatQ1 } from '../messages/csat.messages';

/**
 * Ejecuta un ciclo de polling:
 * 1. Obtiene conversaciones listas para CSAT de FAQ del backend:
 *      faqHitCount > 0 AND csatRequired=false AND lastActivityAt < NOW() - FAQ_SURVEY_DELAY_SECONDS
 *    El chequeo del delay lo hace el notification-service pasando delaySeconds al endpoint.
 * 2. Verifica bot_csat_faqs_enabled para la propiedad.
 *    Si está desactivado, omite el envío sin modificar el estado.
 * 3. Obtiene en paralelo guest y property (cacheada).
 * 4. Crea el registro csat_surveys { trigger:'faq', status:'pending' } en el backend.
 * 5. Resuelve el canal y envía Q1.
 * 6. Marca csatRequired=true para excluirla en próximos ciclos.
 */
export async function runConversationCsatWorker(): Promise<void> {
  let pending: ConversationDto[];

  try {
    pending = await conversations.getFaqCsatReady();
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

    // Crear registro en csat_surveys para trackear respuestas (Q1, Q2)
    const survey = await csatSurveys.create({
      ticketId:       null,
      propertyId:     conversation.propertyId,
      organizationId: conversation.organizationId,
      guestId:        conversation.guestId,
      conversationId: conversation.id,
      surveyTrigger:  'faq',
    });

    if (!survey) {
      console.error('[conversation-csat-worker] csat_survey_create_failed', {
        conversationId: conversation.id,
      });
      return;
    }

    const channel = resolveChannel(guest, property);
    await channel.send(conversationCsatQ1());
    await csatSurveys.markSent(survey.id);
    await conversations.markCsatSent(conversation.id);

    console.log('[conversation-csat-worker] csat_sent', {
      conversationId: conversation.id,
      surveyId:       survey.id,
      propertyId:     conversation.propertyId,
      guest:          `${guest.phonePrefix}${guest.phoneNumber}`,
    });
  } catch (err) {
    console.error('[conversation-csat-worker] processing_failed', {
      conversationId: conversation.id,
      err,
    });
  }
}
