/** Guest operations against the NestJS backend. */
import { getNestjsClient } from '../nestjs.client';
import { GuestEndpoints } from './guest.endpoints';
import { GuestDto } from './guest.schemas';

export async function getById(guestId: string): Promise<GuestDto | null> {
  const client = getNestjsClient();
  const data = await client._get<GuestDto>(
    GuestEndpoints.BY_ID.replace('{id}', guestId),
  );
  if (!data) {
    console.warn('[guest-service] guest_not_found', { guestId });
    return null;
  }
  return data;
}
