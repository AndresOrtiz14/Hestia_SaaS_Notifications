import cron from 'node-cron';
import { config } from './config';
import { createApp } from './app';
import { runCsatWorker } from './workers/csat.worker';
import { runConversationCsatWorker } from './workers/conversation-csat.worker';
import { runTicketNotifyWorker } from './workers/ticket-notify.worker';

// ── Servidor HTTP ─────────────────────────────────────────────────────────────
const app = createApp();
app.listen(config.server.port, () => {
  console.log(`[notification-service] Servidor escuchando en puerto ${config.server.port}`);
});

// ── Workers de polling ────────────────────────────────────────────────────────
const intervalSeconds = config.worker.pollingIntervalSeconds;
const cronExpression = `*/${intervalSeconds} * * * * *`; // cada N segundos

console.log(`[notification-service] Workers iniciados — polling cada ${intervalSeconds}s`);

cron.schedule(cronExpression, () => {
  runCsatWorker().catch((err) =>
    console.error('[notification-service] Error inesperado en csat-worker:', err),
  );
  runConversationCsatWorker().catch((err) =>
    console.error('[notification-service] Error inesperado en conversation-csat-worker:', err),
  );
  runTicketNotifyWorker().catch((err) =>
    console.error('[notification-service] Error inesperado en ticket-notify-worker:', err),
  );
});

// Ejecutar una vez al arrancar para no esperar el primer intervalo
runCsatWorker().catch(console.error);
runConversationCsatWorker().catch(console.error);
runTicketNotifyWorker().catch(console.error);
