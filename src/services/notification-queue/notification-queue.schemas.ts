/** DTOs for the Notification Queue domain (mirrors NestJS NotificationQueueResponseDto). */
export interface NotificationQueueEntryDto {
  id:             string;
  type:           string;
  recipientType:  string;   // 'guest' | 'staff' | 'supervisor'
  recipientId:    string;
  propertyId:     string;
  organizationId: string | null;
  campaignId:     string | null;
  payload:        Record<string, unknown>;
  scheduledAt:    string;
  status:         string;
  retries:        number;
  lastError:      string | null;
  createdAt:      string;
  processedAt:    string | null;
}

export interface UpdateNotificationQueueDto {
  status:       'sent' | 'failed' | 'cancelled';
  lastError?:   string;
  processedAt:  string;
}
