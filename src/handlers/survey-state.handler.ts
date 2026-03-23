import * as csatSurveys from '../services/csat-surveys/csat-survey.service';
import { CsatSurveyDto } from '../services/csat-surveys/csat-survey.schemas';
import * as guests from '../services/guests/guest.service';
import * as properties from '../services/properties/property.service';
import { NotificationChannel } from '../channels/channel.interface';
import { resolveChannel } from '../channels/channel.resolver';
import { extractRating } from '../utils/rating.extractor';
import * as msg from '../messages/csat.messages';

/**
 * Procesa la respuesta de un huésped para una encuesta activa.
 *
 * @returns true si el mensaje fue manejado por la encuesta, false si el bot
 *          principal debe continuar con el pipeline normal.
 */
export async function handleSurveyResponse(
  guestId: string,
  messageText: string,
): Promise<boolean> {
  const survey = await csatSurveys.getActiveForGuest(guestId);
  if (!survey) return false;

  const [guest, property] = await Promise.all([
    guests.getById(guestId),
    properties.getById(survey.propertyId),
  ]);

  if (!guest || !property) {
    console.error('[survey-handler] guest_or_property_not_found', {
      guestId,
      propertyId: survey.propertyId,
    });
    return false;
  }

  let channel: NotificationChannel;
  try {
    channel = resolveChannel(guest, property);
  } catch (err) {
    console.error('[survey-handler] no_channel_available', { propertyId: survey.propertyId, err });
    return false;
  }

  if (survey.satisfactionScore === null) {
    await processQ1(survey, channel, messageText);
    return true;
  }

  if (survey.followUpComment === null) {
    await processQ2(survey, channel, messageText);
    return true;
  }

  if (survey.surveyTrigger === 'ticket' && survey.channelUtilityScore === null) {
    await processQ3(survey, channel, messageText);
    return true;
  }

  // Encuesta ya completada — no interferir
  return false;
}

// ── Procesadores por pregunta ────────────────────────────────────────────────────

async function processQ1(
  survey: CsatSurveyDto,
  channel: NotificationChannel,
  text: string,
): Promise<void> {
  const score = extractRating(text);

  if (!score) {
    await channel.send(msg.invalidRatingMessage());
    return;
  }

  await csatSurveys.recordSatisfaction(survey.id, score);

  // FAQ: si score ≥ 4 saltamos Q2 y completamos
  if (survey.surveyTrigger === 'faq' && score >= 4) {
    await csatSurveys.complete(survey.id);
    await channel.send(msg.thankYouMessage());
    return;
  }

  const followUpVariant = score <= 3 ? 'improvement' : 'praise';
  const q2 = followUpVariant === 'improvement' ? msg.ticketQ2Improvement() : msg.ticketQ2Praise();
  await channel.send(survey.surveyTrigger === 'faq' ? msg.faqQ2() : q2);
}

async function processQ2(
  survey: CsatSurveyDto,
  channel: NotificationChannel,
  text: string,
): Promise<void> {
  if (text.trim().length < 3) {
    await channel.send(msg.shortCommentMessage());
    return;
  }

  await csatSurveys.recordFollowUp(survey.id, text.trim());

  // FAQ no tiene Q3 → completar
  if (survey.surveyTrigger === 'faq') {
    await csatSurveys.complete(survey.id);
    await channel.send(msg.thankYouMessage());
    return;
  }

  // Ticket → enviar Q3
  await channel.send(msg.ticketQ3());
}

async function processQ3(
  survey: CsatSurveyDto,
  channel: NotificationChannel,
  text: string,
): Promise<void> {
  const score = extractRating(text);

  if (!score) {
    await channel.send(msg.invalidRatingMessage());
    return;
  }

  await csatSurveys.recordChannelUtility(survey.id, score);
  await channel.send(msg.thankYouMessage());
}
