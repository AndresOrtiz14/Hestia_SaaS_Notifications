import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const config = {
  hestia: {
    apiUrl: required('HESTIA_API_URL'),
    apiKey: required('HESTIA_API_KEY'),
  },
  worker: {
    pollingIntervalSeconds: parseInt(process.env.POLLING_INTERVAL_SECONDS ?? '10', 10),
  },
  server: {
    port: parseInt(process.env.PORT ?? '4000', 10),
    webhookSecret: required('WEBHOOK_SECRET'),
  },
  whatsapp: {
    verifyToken: required('WHATSAPP_VERIFY_TOKEN'),
  },
} as const;
