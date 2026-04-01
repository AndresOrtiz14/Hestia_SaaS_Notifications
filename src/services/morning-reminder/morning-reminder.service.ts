/** Morning Reminder data fetching against the NestJS backend. */
import { getNestjsClient } from '../nestjs.client';
import { MorningReminderEndpoints } from './morning-reminder.endpoints';
import {
  MorningReminderPropertyDto,
  StaffWithTicketsDto,
  SupervisorWithSummaryDto,
} from './morning-reminder.schemas';

export async function getActiveProperties(): Promise<MorningReminderPropertyDto[]> {
  const client = getNestjsClient();
  const data = await client._get<MorningReminderPropertyDto[]>(
    MorningReminderEndpoints.ACTIVE_PROPERTIES,
  );
  return data ?? [];
}

export async function getStaffWithTickets(propertyId: string): Promise<StaffWithTicketsDto[]> {
  const client = getNestjsClient();
  const data = await client._get<StaffWithTicketsDto[]>(
    MorningReminderEndpoints.STAFF_WITH_TICKETS.replace('{id}', propertyId),
  );
  return data ?? [];
}

export async function getSupervisorsWithSummary(propertyId: string): Promise<SupervisorWithSummaryDto[]> {
  const client = getNestjsClient();
  const data = await client._get<SupervisorWithSummaryDto[]>(
    MorningReminderEndpoints.SUPERVISORS_WITH_SUMMARY.replace('{id}', propertyId),
  );
  return data ?? [];
}
