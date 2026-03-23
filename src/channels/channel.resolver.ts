import { GuestDto } from '../services/guests/guest.schemas';
import { PropertyDto } from '../services/properties/property.schemas';
import { NotificationChannel } from './channel.interface';
import { WhatsAppChannel } from './whatsapp.channel';

/**
 * Resolves the notification channel for a guest/property pair.
 *
 * Priority order (extend here as new channels are added):
 *   1. WhatsApp — if property has whatsappPhoneNumberId + whatsappCloudToken
 *   2. Telegram  — if property has telegramBotToken        (not yet implemented)
 *   3. Web widget — if property has webWidgetEnabled       (not yet implemented)
 */
export function resolveChannel(guest: GuestDto, property: PropertyDto): NotificationChannel {
  if (property.whatsappPhoneNumberId && property.whatsappCloudToken) {
    return new WhatsAppChannel(guest, property);
  }

  // Future: Telegram
  // if (property.telegramBotToken) {
  //   return new TelegramChannel(guest, property);
  // }

  // Future: Web widget
  // if (property.webWidgetEnabled) {
  //   return new WebWidgetChannel(guest, property);
  // }

  throw new Error(`[channel-resolver] No notification channel configured for property ${property.id}`);
}
