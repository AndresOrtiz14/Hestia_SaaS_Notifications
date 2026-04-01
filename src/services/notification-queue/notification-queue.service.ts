/** Notification Queue operations against the NestJS backend. */
import { getNestjsClient } from '../nestjs.client';
import { NotificationQueueEndpoints } from './notification-queue.endpoints';
import {
  NotificationQueueEntryDto,
  UpdateNotificationQueueDto,
} from './notification-queue.schemas';

export async function getPending(): Promise<NotificationQueueEntryDto[]> {
  const client = getNestjsClient();
  const data = await client._get<NotificationQueueEntryDto[]>(
    NotificationQueueEndpoints.PENDING,
  );
  return data ?? [];
}

export async function markSent(id: string): Promise<void> {
  const client = getNestjsClient();
  const body: UpdateNotificationQueueDto = {
    status:      'sent',
    processedAt: new Date().toISOString(),
  };
  await client._put(NotificationQueueEndpoints.BY_ID.replace('{id}', id), body);
}

export async function markFailed(id: string, error: string): Promise<void> {
  const client = getNestjsClient();
  const body: UpdateNotificationQueueDto = {
    status:      'failed',
    lastError:   error,
    processedAt: new Date().toISOString(),
  };
  await client._put(NotificationQueueEndpoints.BY_ID.replace('{id}', id), body);
}
