/**
 * Feature flag operations against the NestJS backend (with in-memory cache).
 *
 * Obtiene todos los flags de una propiedad de una sola llamada y los indexa
 * por key → enabled para consultas O(1).
 * TTL: 5 minutos (los flags pueden cambiar más seguido que la config de property).
 */
import { getNestjsClient } from '../nestjs.client';
import { FeatureFlagEndpoints } from './feature-flag.endpoints';
import { PropertyFeatureFlagDto } from './feature-flag.schemas';
import { FeatureFlagKey } from './feature-flag.keys';

// ── Cache ──────────────────────────────────────────────────────────────────────

const FLAG_TTL = 300; // seconds — 5 minutes
const _flagCache = new Map<string, [Map<string, boolean>, number]>();

function cacheGet(propertyId: string): Map<string, boolean> | null {
  const entry = _flagCache.get(propertyId);
  if (entry && (Date.now() / 1_000 - entry[1]) < FLAG_TTL) return entry[0];
  return null;
}

function cacheSet(propertyId: string, flags: Map<string, boolean>): void {
  _flagCache.set(propertyId, [flags, Date.now() / 1_000]);
}

// ── Service functions ──────────────────────────────────────────────────────────

async function getFlagsForProperty(propertyId: string): Promise<Map<string, boolean>> {
  const cached = cacheGet(propertyId);
  if (cached) return cached;

  const client = getNestjsClient();
  const data = await client._get<PropertyFeatureFlagDto[]>(
    FeatureFlagEndpoints.PROPERTY_FLAGS.replace('{property_id}', propertyId),
  );

  const flagMap = new Map<string, boolean>();
  for (const flag of data ?? []) {
    flagMap.set(flag.key, flag.enabled);
  }

  cacheSet(propertyId, flagMap);
  return flagMap;
}

export async function isEnabled(propertyId: string, key: FeatureFlagKey): Promise<boolean> {
  try {
    const flags = await getFlagsForProperty(propertyId);
    return flags.get(key) === true;
  } catch (err) {
    console.error('[feature-flag-service] error_checking_flag', { propertyId, key, err });
    // En caso de error, no bloquear — dejar pasar con false (seguro por defecto)
    return false;
  }
}

export function invalidateCache(propertyId?: string): void {
  if (propertyId) {
    _flagCache.delete(propertyId);
  } else {
    _flagCache.clear();
  }
}
