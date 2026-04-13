/** Staff/Supervisor operations against the NestJS backend (with in-memory cache). */
import { getNestjsClient } from '../nestjs.client';
import { StaffEndpoints } from './staff.endpoints';
import { StaffDto } from './staff.schemas';

// ── Cache ──────────────────────────────────────────────────────────────────────

const STAFF_TTL = 300; // seconds — 5 minutes
const _staffCache = new Map<string, [StaffDto, number]>();

function cacheGet(id: string): StaffDto | null {
  const entry = _staffCache.get(id);
  if (entry && (Date.now() / 1_000 - entry[1]) < STAFF_TTL) return entry[0];
  return null;
}

function cacheSet(id: string, staff: StaffDto): void {
  _staffCache.set(id, [staff, Date.now() / 1_000]);
}

// ── Service functions ──────────────────────────────────────────────────────────

export async function getSupervisorsByProperty(
  propertyId: string,
  areaCode?: string,
): Promise<StaffDto[]> {
  const client = getNestjsClient();
  const params: Record<string, string | undefined> = {
    propertyId,
    ...(areaCode ? { areaCode } : {}),
  };
  const data = await client._get<StaffDto[]>(StaffEndpoints.SUPERVISORS, params);
  if (!data) {
    console.warn('[staff-service] supervisors_not_found', { propertyId, areaCode });
    return [];
  }
  return data;
}

export async function getById(staffId: string): Promise<StaffDto | null> {
  const cached = cacheGet(staffId);
  if (cached) return cached;

  const client = getNestjsClient();
  const data = await client._get<StaffDto>(
    StaffEndpoints.BY_ID.replace('{id}', staffId),
  );
  if (!data) {
    console.warn('[staff-service] staff_not_found', { staffId });
    return null;
  }

  cacheSet(staffId, data);
  return data;
}
