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
    pollingIntervalSeconds:  Number.parseInt(process.env.POLLING_INTERVAL_SECONDS  ?? '10', 10),
    faqSurveyDelaySeconds:   Number.parseInt(process.env.FAQ_SURVEY_DELAY_SECONDS  ?? '30', 10),
  },
  server: {
    port: Number.parseInt(process.env.PORT ?? '4000', 10),
  },
  whatsapp: {
    verifyToken: required('WHATSAPP_VERIFY_TOKEN'),
  },
} as const;
