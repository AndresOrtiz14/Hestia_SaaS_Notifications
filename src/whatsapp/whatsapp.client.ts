import axios from 'axios';

export interface WaCredentials {
  phoneNumberId: string;
  cloudToken: string;
}

/**
 * Envía un mensaje de texto simple vía WhatsApp Cloud API.
 * @param to    Número en formato internacional sin '+' (ej: "5215512345678")
 * @param text  Texto del mensaje
 * @param creds Credenciales de la property (phoneNumberId + cloudToken)
 */
export async function sendWhatsAppMessage(
  to: string,
  text: string,
  creds: WaCredentials,
): Promise<void> {
  const url = `https://graph.facebook.com/v20.0/${creds.phoneNumberId}/messages`;

  await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text, preview_url: false },
    },
    {
      headers: {
        Authorization: `Bearer ${creds.cloudToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    },
  );
}

/**
 * Construye el número WA completo a partir del Guest (phonePrefix + phoneNumber).
 * Elimina el '+' del prefijo si existe.
 */
export function buildWaNumber(phonePrefix: string, phoneNumber: string): string {
  const prefix = phonePrefix.startsWith('+') ? phonePrefix.slice(1) : phonePrefix;
  const number = phoneNumber.replaceAll(/\D/g, '');
  return `${prefix}${number}`;
}
