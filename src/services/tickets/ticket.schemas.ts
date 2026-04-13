/** DTOs for the Tickets domain (mirrors NestJS TicketResponseDto). */
export interface TicketDto {
  id: string;
  organizationId: string;
  propertyId: string;
  title: string;
  description: string;
  areaCode: string;
  areaId: string | null;
  ticketType: string | null;
  priority: string;
  status: string;
  channel: string;
  guestId: string | null;
  createdByUserId: string | null;
  roomNumber: string | null;
  locationDescription: string | null;
  assignedToUserId: string | null;
  idCode: number;
  requiresApproval: boolean;
  notifyGuestPending: boolean;
  /** Estado que disparó la notificación (guardado en el backend al momento del cambio). */
  notifyGuestStatus: string | null;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
  photoUrl: string | null;
  unassignedAlertSentAt: string | null;
  unstartedAlertSentAt: string | null;
}
