/** DTOs for the Properties domain (read-only, mirrors NestJS PropertyResponseDto). */
export interface PropertyDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  propertyType: string;
  isHeadquarters: boolean;
  officialStarRating: number | null;
  roomCount: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  timezone:          string;
  workingHoursStart: string;   // "HH:MM", ej: "07:00"
  workingHoursEnd:   string;   // "HH:MM", ej: "23:00"
  language: string;
  phonePrefix: string | null;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  // Bot de huéspedes (canal de atención al cliente)
  whatsappPhonePrefix: string | null;
  whatsappPhoneNumber: string | null;
  whatsappPhoneNumberId: string | null;
  whatsappBusinessAccountId: string | null;
  whatsappCloudToken: string | null;
  // Bot de personal interno (staff y supervisores)
  whatsappWorkersPhonePrefix: string | null;
  whatsappWorkersPhoneNumber: string | null;
  whatsappWorkersPhoneNumberId: string | null;
  whatsappWorkersBusinessAccountId: string | null;
  whatsappWorkersCloudToken: string | null;
  telegramBotToken: string | null;
  webWidgetEnabled: boolean;
  webWidgetDomain: string | null;
  onboardingCompleted: boolean;
  goLiveDate: string | null;
  createdAt: string;
  updatedAt: string;
}
