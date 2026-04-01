import cron from 'node-cron';
import { config } from './config';
import { createApp } from './app';
import { runCsatWorker } from './workers/csat.worker';
import { runConversationCsatWorker } from './workers/conversation-csat.worker';
import { runTicketNotifyWorker } from './workers/ticket-notify.worker';
import { runNotificationQueueWorker } from './workers/notification-queue.worker';
import { runMorningReminderWorker }   from './workers/morning-reminder.worker';

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
  runNotificationQueueWorker().catch((err) =>
    console.error('[notification-service] Error inesperado en notification-queue-worker:', err),
  );
});

// ── Cron del morning reminder — cada minuto ───────────────────────────────────
// El worker decide internamente si ya es hora de enviar según la timezone de cada hotel.
cron.schedule('* * * * *', () => {
  runMorningReminderWorker().catch((err) =>
    console.error('[notification-service] Error inesperado en morning-reminder-worker:', err),
  );
});

// Ejecutar una vez al arrancar para no esperar el primer intervalo
runCsatWorker().catch(console.error);
runConversationCsatWorker().catch(console.error);
runTicketNotifyWorker().catch(console.error);
runNotificationQueueWorker().catch(console.error);
