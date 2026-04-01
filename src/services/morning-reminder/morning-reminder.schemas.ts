/** DTOs for the Morning Reminder API endpoints. */

export interface MorningReminderPropertyDto {
  id:                string;
  organizationId:    string;
  workingHoursStart: string;   // "HH:MM"
  workingHoursEnd:   string;   // "HH:MM"
  timezone:          string;   // IANA, ej: "America/Mexico_City"
}

export interface OpenTicketDto {
  id:         string;
  title:      string;
  areaCode:   string;
  roomNumber: string | null;
  createdAt:  string;   // ISO timestamp
}

export interface StaffWithTicketsDto {
  id:                string;
  name:              string;
  phonePrefix:       string | null;
  phoneNumber:       string | null;
  preferredLanguage: string | null;
  openTickets:       OpenTicketDto[];
}

export interface AreaSummaryDto {
  area:        string;
  count:       number;
  oldestHours: number;
}

export interface SupervisorSummaryDto {
  total:   number;
  byArea:  AreaSummaryDto[];
  overdue: number;
}

export interface SupervisorWithSummaryDto {
  id:                string;
  name:              string;
  phonePrefix:       string | null;
  phoneNumber:       string | null;
  preferredLanguage: string | null;
  summary:           SupervisorSummaryDto;
}
