import express, { Request, Response } from 'express';
import { handleSurveyResponse } from './handlers/survey-state.handler';

export function createApp(): express.Application {
  const app = express();
  app.use(express.json());

  // ── Health check ──────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'hestia-notification-service' });
  });

  /**
   * POST /webhook/survey-response
   *
   * Llamado por el bot principal cuando llega un mensaje de WhatsApp.
   * El bot envía el mensaje ANTES de su pipeline normal.
   *
   * Body:
   *   { guestId: string, message: string }
   *
   * Response:
   *   { handled: boolean }
   *   - true  → el mensaje fue una respuesta de encuesta; el bot NO debe procesar más
   *   - false → el mensaje no pertenece a ninguna encuesta activa; el bot continúa normalmente
   */
  app.post('/webhook/survey-response', async (req: Request, res: Response) => {
    const { guestId, message } = req.body as { guestId?: string; message?: string };

    if (!guestId || typeof message !== 'string') {
      res.status(400).json({ error: 'guestId y message son requeridos' });
      return;
    }

    try {
      const handled = await handleSurveyResponse(guestId, message);
      res.json({ handled });
    } catch (err) {
      console.error('[webhook] Error procesando respuesta de encuesta:', err);
      // Devolvemos handled=false para que el bot principal no se quede bloqueado
      res.status(500).json({ handled: false, error: 'Internal error' });
    }
  });

  return app;
}
