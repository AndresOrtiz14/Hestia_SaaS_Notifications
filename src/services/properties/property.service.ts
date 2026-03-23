/** Property operations against the NestJS backend (with in-memory cache). */
import { getNestjsClient } from '../nestjs.client';
import { PropertyEndpoints } from './property.endpoints';
import { PropertyDto } from './property.schemas';

// ── Cache ──────────────────────────────────────────────────────────────────────

const PROPERTY_TTL = 600; // seconds — 10 minutes
const _propertyCache = new Map<string, [PropertyDto, number]>();

function cacheGet(key: string): PropertyDto | null {
  const entry = _propertyCache.get(key);
  if (entry && (Date.now() / 1_000 - entry[1]) < PROPERTY_TTL) return entry[0];
  return null;
}

function cacheSet(key: string, prop: PropertyDto): void {
  _propertyCache.set(key, [prop, Date.now() / 1_000]);
}

// ── Service functions ──────────────────────────────────────────────────────────

export async function getById(propertyId: string): Promise<PropertyDto | null> {
  const cacheKey = `id:${propertyId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const client = getNestjsClient();
  const data = await client._get<PropertyDto>(
    PropertyEndpoints.BY_ID.replace('{id}', propertyId),
  );
  if (!data) return null;

  cacheSet(cacheKey, data);
  console.log('[property-service] property_resolved', { propertyId, name: data.name });
  return data;
}

export async function getByWhatsappPhone(phoneNumberId: string): Promise<PropertyDto | null> {
  const cacheKey = `wa:${phoneNumberId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const client = getNestjsClient();
  const data = await client._get<PropertyDto>(
    PropertyEndpoints.BY_WHATSAPP_PHONE.replace('{phone_number_id}', phoneNumberId),
  );
  if (!data) {
    console.warn('[property-service] tenant_not_found', { phoneNumberId });
    return null;
  }

  cacheSet(cacheKey, data);
  console.log('[property-service] tenant_resolved', {
    phoneNumberId,
    propertyId: data.id,
    propertyName: data.name,
  });
  return data;
}

export async function getByCode(code: string): Promise<PropertyDto | null> {
  const cacheKey = `code:${code}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const client = getNestjsClient();
  const data = await client._get<PropertyDto>(
    PropertyEndpoints.BY_CODE.replace('{code}', code),
  );
  if (!data) {
    console.warn('[property-service] tenant_not_found_by_code', { code });
    return null;
  }

  cacheSet(cacheKey, data);
  console.log('[property-service] tenant_resolved_by_code', {
    code,
    propertyId: data.id,
    propertyName: data.name,
  });
  return data;
}

export function invalidateCache(propertyId?: string): void {
  if (propertyId) {
    for (const [key, [prop]] of _propertyCache.entries()) {
      if (prop.id === propertyId) _propertyCache.delete(key);
    }
  } else {
    _propertyCache.clear();
  }
}
