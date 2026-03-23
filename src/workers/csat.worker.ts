import * as csatSurveys from '../services/csat-surveys/csat-survey.service';
import { CsatSurveyDto } from '../services/csat-surveys/csat-survey.schemas';
import * as guests from '../services/guests/guest.service';
import * as properties from '../services/properties/property.service';
import * as featureFlags from '../services/feature-flags/feature-flag.service';
import { FeatureFlagKeys } from '../services/feature-flags/feature-flag.keys';
import { resolveChannel } from '../channels/channel.resolver';
import * as msg from '../messages/csat.messages';

/**
 * Ejecuta un ciclo de polling:
 * 1. Obtiene todas las encuestas pendientes del backend.
 * 2. Verifica el feature flag correspondiente al tipo de encuesta (faq | ticket).
 *    Si está desactivado, omite el envío sin modificar el estado.
 * 3. Por cada una, obtiene en paralelo el guest y las credenciales de la property (cacheadas).
 * 4. Resuelve el canal de notificación y envía la Q1 correspondiente (ticket o FAQ).
 * 5. Marca la encuesta como 'sent'.
 */
export async function runCsatWorker(): Promise<void> {
  let surveys: CsatSurveyDto[];

  try {
    surveys = await csatSurveys.getPending();
  } catch (err) {
    console.error('[csat-worker] Error obteniendo encuestas pendientes:', err);
    return;
  }

  if (surveys.length === 0) return;

  console.log(`[csat-worker] ${surveys.length} encuesta(s) pendiente(s) de envío`);

  for (const survey of surveys) {
    await processPendingSurvey(survey);
  }
}

async function processPendingSurvey(survey: CsatSurveyDto): Promise<void> {
  try {
    const flagKey =
      survey.surveyTrigger === 'faq'
        ? FeatureFlagKeys.BOT_CSAT_FAQS
        : FeatureFlagKeys.BOT_CSAT_TICKETS;

    const enabled = await featureFlags.isEnabled(survey.propertyId, flagKey);
    if (!enabled) {
      console.log('[csat-worker] feature_disabled_skip', {
        surveyId: survey.id,
        trigger: survey.surveyTrigger,
        flag: flagKey,
      });
      return;
    }

    const [guest, property] = await Promise.all([
      guests.getById(survey.guestId),
      properties.getById(survey.propertyId),
    ]);

    if (!guest || !property) {
      console.error('[csat-worker] guest_or_property_not_found', {
        surveyId: survey.id,
        guestId: survey.guestId,
        propertyId: survey.propertyId,
      });
      return;
    }

    const channel = resolveChannel(guest, property);

    const question =
      survey.surveyTrigger === 'ticket'
        ? msg.ticketQ1(survey.ticketId ?? survey.id)
        : msg.faqQ1();

    await channel.send(question);
    await csatSurveys.markSent(survey.id);

    console.log('[csat-worker] q1_sent', {
      surveyId: survey.id,
      trigger: survey.surveyTrigger,
      propertyId: survey.propertyId,
      guest: `${guest.phonePrefix}${guest.phoneNumber}`,
    });
  } catch (err) {
    console.error('[csat-worker] survey_processing_failed', { surveyId: survey.id, err });
  }
}
