# Hestia Notification Service

Servicio externo de notificaciones CSAT para Hestia. Envía encuestas de satisfacción vía **WhatsApp Cloud API** y gestiona las respuestas de los huéspedes.

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

| Variable | Descripción |
|---|---|
| `HESTIA_API_URL` | URL base del backend de Hestia (e.g. `http://localhost:3000/api/v1`) |
| `HESTIA_API_KEY` | API key interna para autenticarse con el backend |
| `POLLING_INTERVAL_SECONDS` | Frecuencia del worker de polling en segundos |
| `FAQ_SURVEY_DELAY_SECONDS` | Delay antes de enviar encuesta FAQ |
| `PORT` | Puerto en que corre este servicio (default: `4000`) |
| `WEBHOOK_SECRET` | Secret para verificar llamadas entrantes desde el bot principal (header `x-webhook-secret`) |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificación del webhook de Meta |

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

Requiere el header `x-webhook-secret` con el valor configurado en `WEBHOOK_SECRET`.

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

- `handled: true` → el mensaje era una respuesta de encuesta; el bot principal no debe procesarlo
- `handled: false` → el mensaje no pertenece a ninguna encuesta activa; el bot continúa normalmente
