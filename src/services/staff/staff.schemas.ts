/** DTOs for the Staff/Supervisor domain (mirrors NestJS StaffResponseDto). */
export interface StaffDto {
  id:                string;
  name:              string;
  phonePrefix:       string | null;
  phoneNumber:       string | null;
  role:              'staff' | 'supervisor' | 'other';
  preferredLanguage: string | null;
}
