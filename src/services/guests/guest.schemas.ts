/** DTOs for the Guests domain (mirrors NestJS GuestResponseDto). */
export interface GuestDto {
  id: string;
  organizationId: string;
  propertyId: string;
  phonePrefix: string;
  phoneNumber: string;
  name: string | null;
  email: string | null;
  preferredLanguage: string | null;
  isBlocked: boolean;
  blockedReason: string | null;
  createdAt: string;
  updatedAt: string;
}
