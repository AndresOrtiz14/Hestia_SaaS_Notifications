import { GuestDto } from '../services/guests/guest.schemas';
import { PropertyDto } from '../services/properties/property.schemas';
import { sendWhatsAppMessage, buildWaNumber, WaCredentials } from '../whatsapp/whatsapp.client';
import { NotificationChannel } from './channel.interface';

export class WhatsAppChannel implements NotificationChannel {
  private readonly to: string;
  private readonly creds: WaCredentials;

  constructor(guest: GuestDto, property: PropertyDto) {
    this.to = buildWaNumber(guest.phonePrefix, guest.phoneNumber);
    this.creds = {
      phoneNumberId: property.whatsappPhoneNumberId!,
      cloudToken: property.whatsappCloudToken!,
    };
  }

  async send(text: string): Promise<void> {
    await sendWhatsAppMessage(this.to, text, this.creds);
  }
}
