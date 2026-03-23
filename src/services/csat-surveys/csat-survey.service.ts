/**
 * CSAT survey operations against the NestJS backend.
 *
 * Survey flow driven by the notification service:
 *   1. getPending()            → fetch all surveys with status='pending'
 *   2. markSent()              → status='sent'
 *   3. recordSatisfaction()    → satisfactionScore, followUpVariant, status='in_progress'
 *   4. recordFollowUp()        → followUpComment
 *   5. recordChannelUtility()  → channelUtilityScore, status='completed'  (trigger=ticket only)
 *   Or: complete()             → status='completed'  (trigger=faq, no Q3)
 *   At any point: cancel()
 */
import { getNestjsClient } from '../nestjs.client';
import { CsatSurveyEndpoints } from './csat-survey.endpoints';
import { CsatSurveyDto } from './csat-survey.schemas';

// ── Create ─────────────────────────────────────────────────────────────────────

export async function create(payload: {
  ticketId: string | null;
  propertyId: string;
  organizationId: string;
  guestId: string;
  conversationId: string | null;
  surveyTrigger: 'ticket' | 'faq';
}): Promise<CsatSurveyDto | null> {
  const client = getNestjsClient();
  const data = await client._post<CsatSurveyDto>(CsatSurveyEndpoints.BASE, payload);
  if (!data) {
    console.error('[csat-survey-service] create_failed', { ticketId: payload.ticketId });
    return null;
  }
  return data;
}

// ── Read ───────────────────────────────────────────────────────────────────────

export async function getPending(): Promise<CsatSurveyDto[]> {
  const client = getNestjsClient();
  const data = await client._get<CsatSurveyDto[]>(CsatSurveyEndpoints.PENDING);
  return data ?? [];
}

export async function getActiveForGuest(guestId: string): Promise<CsatSurveyDto | null> {
  const client = getNestjsClient();
  return client._get<CsatSurveyDto>(
    CsatSurveyEndpoints.ACTIVE_FOR_GUEST.replace('{guest_id}', guestId),
  );
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

export async function markSent(surveyId: string): Promise<CsatSurveyDto | null> {
  return _update(surveyId, { status: 'sent' });
}

// ── Q1: Satisfaction score (1-5) ───────────────────────────────────────────────

export async function recordSatisfaction(
  surveyId: string,
  score: number,
): Promise<CsatSurveyDto | null> {
  const followUpVariant = score <= 3 ? 'improvement' : 'praise';
  return _update(surveyId, {
    satisfactionScore: score,
    followUpVariant,
    status: 'in_progress',
  });
}

// ── Q2: Follow-up comment ──────────────────────────────────────────────────────

export async function recordFollowUp(
  surveyId: string,
  comment: string,
): Promise<CsatSurveyDto | null> {
  return _update(surveyId, { followUpComment: comment });
}

// ── Q3: Channel utility score (1-5) — trigger=ticket only ─────────────────────

export async function recordChannelUtility(
  surveyId: string,
  score: number,
): Promise<CsatSurveyDto | null> {
  return _update(surveyId, {
    channelUtilityScore: score,
    completedAt: new Date().toISOString(),
    status: 'completed',
  });
}

// ── Complete (no Q3) ───────────────────────────────────────────────────────────

export async function complete(surveyId: string): Promise<CsatSurveyDto | null> {
  return _update(surveyId, {
    completedAt: new Date().toISOString(),
    status: 'completed',
  });
}

// ── Cancel ─────────────────────────────────────────────────────────────────────

export async function cancel(
  surveyId: string,
  reason = 'guest_no_response',
): Promise<CsatSurveyDto | null> {
  return _update(surveyId, {
    status: 'cancelled',
    canceledReason: reason,
  });
}

// ── Internal ───────────────────────────────────────────────────────────────────

async function _update(
  surveyId: string,
  payload: Record<string, unknown>,
): Promise<CsatSurveyDto | null> {
  const client = getNestjsClient();
  const data = await client._put<CsatSurveyDto>(
    CsatSurveyEndpoints.BY_ID.replace('{id}', surveyId),
    payload,
  );
  if (!data) {
    console.error('[csat-survey-service] update_failed', { surveyId });
    return null;
  }
  return data;
}
