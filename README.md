# Hestia Notification Service

Servicio de notificaciones para Hestia SaaS. Gestiona el envío de mensajes WhatsApp a huéspedes y las encuestas de satisfacción (CSAT) de forma desacoplada del backend principal.

**Qué hace:**
- Notifica cambios de estado de tickets al huésped (`assigned`, `in_progress`, `resolved`)
- Envía encuestas CSAT tras resolver un ticket (Q1 → Q2 → Q3)
- Envía encuestas CSAT a conversaciones FAQ inactivas (Q1 → Q2)
- Recibe respuestas de encuesta via webhook desde el bot principal

---

## Requisitos previos

- **Node.js** v18 o superior
- **npm** v9 o superior
- Acceso a la **WhatsApp Cloud API** de Meta (credenciales por propiedad en la base de datos de Hestia)
- El **backend de Hestia** corriendo y accesible en la URL configurada

---

## Instalación

```bash
npm install
```

---

## Variables de entorno

Copia el archivo de ejemplo y completa los valores:

```bash
cp .env.example .env
```

| Variable | Descripción | Default |
|---|---|---|
| `HESTIA_API_URL` | URL base del backend de Hestia (e.g. `http://localhost:3000/api/v1`) | — |
| `HESTIA_API_KEY` | API key interna para autenticarse con el backend | — |
| `POLLING_INTERVAL_SECONDS` | Frecuencia de los workers en segundos | `10` |
| `FAQ_SURVEY_DELAY_SECONDS` | Segundos de inactividad antes de enviar CSAT de FAQ | `30` |
| `PORT` | Puerto del servidor HTTP | `4000` |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificación del webhook de Meta | — |

> Las credenciales de WhatsApp por tenant (`phone_id`, `token`) se obtienen desde la base de datos a través del backend de Hestia.

---

## Ejecución

### Desarrollo (con recarga automática)

```bash
npm run watch
```

### Desarrollo (sin recarga automática)

```bash
npm run dev
```

### Producción (sin recarga automática)

```bash
npm run build
npm start
```

---

## Deploy en Render

1. Crea un nuevo **Web Service** apuntando al repositorio.
2. Configura los siguientes valores en el dashboard de Render:

| Campo | Valor |
|---|---|
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

3. En **Environment Variables**, agrega todas las variables listadas en la sección anterior.

> Render asigna el puerto automáticamente via la variable `PORT` — el servicio ya la respeta.

---

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check del servicio |
| `POST` | `/webhook/survey-response` | Recibe respuestas de encuesta desde el bot principal |

### `POST /webhook/survey-response`

Llamado por el bot principal cuando llega un mensaje de WhatsApp, antes de su pipeline normal.

**Body:**
```json
{
  "guestId": "string",
  "message": "string"
}
```

**Response:**
```json
{ "handled": true }
```

- `handled: true` → el mensaje era una respuesta de encuesta; el bot **no debe procesarlo**
- `handled: false` → no pertenece a ninguna encuesta activa; el bot continúa normalmente

---

## Workers

Los workers hacen polling cada `POLLING_INTERVAL_SECONDS` segundos y también se ejecutan una vez al arrancar.

### `ticket-notify.worker`
1. Obtiene tickets con `notifyGuestPending=true` del backend
2. Verifica feature flag `bot_tickets_enabled` para la propiedad
3. Envía el mensaje según `notifyGuestStatus` (`assigned` | `in_progress` | `resolved`)
4. Si fue `resolved` y `bot_csat_tickets_enabled`, crea un survey `pending`
5. Marca `notifyGuestPending=false`

### `conversation-csat.worker`
1. Obtiene conversaciones con `faqHitCount > 0`, `csatRequired=false` y `lastActivityAt < NOW() - FAQ_SURVEY_DELAY_SECONDS`
2. Verifica feature flag `bot_csat_faqs_enabled`
3. Crea survey `{ trigger:'faq', status:'pending' }` y envía Q1
4. Marca `csatRequired=true` en la conversación

### `csat.worker`
1. Obtiene surveys con `status=pending`
2. Envía Q1 via WhatsApp
3. Marca `status=sent`

---

## Feature flags

Todos los feature flags se verifican en este servicio — el backend nunca los verifica.

| Flag | Verificado por |
|---|---|
| `bot_tickets_enabled` | `ticket-notify.worker` |
| `bot_csat_tickets_enabled` | `ticket-notify.worker` + `csat.worker` |
| `bot_csat_faqs_enabled` | `conversation-csat.worker` |
| `whatsapp_channel_enabled` | Channel resolver |
