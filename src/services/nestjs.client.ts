/**
 * Base async HTTP client for the NestJS backend API.
 * All database operations go through the NestJS API — no direct DB access.
 *
 * Domain-specific operations live in their own modules
 * (e.g. services/properties/, services/csat-surveys/).
 */
import axios from 'axios';
import { config } from '../config';

// ── Error ─────────────────────────────────────────────────────────────────────

export class NestjsClientError extends Error {}

// ── Client ────────────────────────────────────────────────────────────────────

class NestjsClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout = 15_000;

  constructor() {
    this.baseUrl = config.hestia.apiUrl.replace(/\/$/, '');
    this.apiKey = config.hestia.apiKey;
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    options: { params?: Record<string, string | undefined>; body?: unknown } = {},
  ): Promise<T | null> {
    const url = `${this.baseUrl}/${path.replace(/^\//, '')}`;
    const delays = [2_000, 5_000, 10_000]; // ms — retry on 429
    let attempt = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const response = await axios.request<unknown>({
          method,
          url,
          params: options.params,
          data: options.body,
          headers: this.headers(),
          timeout: this.timeout,
          validateStatus: () => true, // handle all status codes manually
        });

        if (response.status === 404) {
          return null;
        }

        if (response.status === 429) {
          if (attempt < delays.length) {
            const delay = delays[attempt];
            console.warn('[nestjs-client] rate_limited', {
              method,
              path,
              attempt: attempt + 1,
              retryInSeconds: delay / 1_000,
            });
            await sleep(delay);
            attempt++;
            continue;
          }
          console.error('[nestjs-client] rate_limited_exhausted', { method, path });
          return null;
        }

        if (response.status >= 400) {
          console.warn('[nestjs-client] request_error', {
            method,
            path,
            status: response.status,
            body: JSON.stringify(response.data).slice(0, 300),
          });
          return null;
        }

        // Unwrap NestJS standard envelope { success, data, ... }
        const body = response.data;
        console.log('[nestjs-client] raw_response', { method, path, status: response.status, body: JSON.stringify(body).slice(0, 500) });
        if (body !== null && typeof body === 'object' && 'data' in body) {
          return (body as { data: T }).data;
        }
        return body as T;

      } catch (err) {
        if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
          console.error('[nestjs-client] timeout', { method, path });
        } else {
          console.error('[nestjs-client] request_failed', { method, path, err });
        }
        return null;
      }
    }
  }

  async _get<T>(path: string, params?: Record<string, string | undefined>): Promise<T | null> {
    return this.request<T>('GET', path, { params });
  }

  async _post<T>(path: string, body?: unknown): Promise<T | null> {
    return this.request<T>('POST', path, { body });
  }

  async _put<T>(path: string, body?: unknown): Promise<T | null> {
    return this.request<T>('PUT', path, { body });
  }

  async _patch<T>(path: string, body?: unknown): Promise<T | null> {
    return this.request<T>('PATCH', path, { body });
  }
}

// ── Module-level singleton ─────────────────────────────────────────────────────

let _client: NestjsClient | null = null;

export function getNestjsClient(): NestjsClient {
  if (!_client) _client = new NestjsClient();
  return _client;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
