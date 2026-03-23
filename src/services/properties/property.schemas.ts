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
  timezone: string;
  language: string;
  phonePrefix: string | null;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  whatsappPhonePrefix: string | null;
  whatsappPhoneNumber: string | null;
  whatsappPhoneNumberId: string | null;
  whatsappBusinessAccountId: string | null;
  whatsappCloudToken: string | null;
  telegramBotToken: string | null;
  webWidgetEnabled: boolean;
  webWidgetDomain: string | null;
  onboardingCompleted: boolean;
  goLiveDate: string | null;
  createdAt: string;
  updatedAt: string;
}
