/** DTOs for the Conversations domain (mirrors NestJS ConversationResponseDto). */
export interface ConversationDto {
  id: string;
  organizationId: string;
  propertyId: string;
  guestId: string;
  channel: string;
  channelThreadId: string | null;
  languageDetected: string | null;
  lastActivityAt: string;
  contextState: Record<string, unknown> | null;
  ticketId: string | null;
  stayId: string | null;
  fallbackCount: number;
  faqHitCount: number;
  csatRequired: boolean;
  confusionDetected: boolean;
  questionRepeated: boolean;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
