/** DTOs for the CSAT Surveys domain (mirrors NestJS CsatSurveyResponseDto). */
export interface CsatSurveyDto {
  id: string;
  conversationId: string | null;
  ticketId: string | null;
  propertyId: string;
  organizationId: string;
  guestId: string;

  /** 'ticket' | 'faq' */
  surveyTrigger: 'ticket' | 'faq';

  /** 'pending' | 'sent' | 'in_progress' | 'completed' | 'cancelled' | 'expired' */
  status: 'pending' | 'sent' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

  // Q1 — Satisfaction score (1-5)
  satisfactionScore: number | null;

  // Q2 — Follow-up comment
  /** 'improvement' | 'praise' */
  followUpVariant: 'improvement' | 'praise' | null;
  followUpComment: string | null;

  // Q3 — Channel utility score (1-5), only for trigger=ticket
  channelUtilityScore: number | null;

  // Lifecycle
  scheduledAt: string | null;
  initiatedAt: string | null;
  completedAt: string | null;
  canceledReason: string | null;

  createdAt: string;
  updatedAt: string;
}
