/**
 * Mapea el type de una NotificationQueueEntry al FeatureFlagKey
 * que controla si esa notificación está habilitada para la propiedad.
 *
 * Retorna null si el tipo no requiere verificación de flag (o es desconocido).
 */
import { FeatureFlagKeys, FeatureFlagKey } from '../feature-flags/feature-flag.keys';

export function getFlagForEntry(
  type: string,
): FeatureFlagKey | null {
  switch (type) {
    case 'ticket.created.fromguest':
      return FeatureFlagKeys.NOTIFICATION_TICKET_CREATED_FROM_GUEST_TO_SUPERVISOR;

    case 'broadcast':
      return FeatureFlagKeys.NOTIFICATION_BROADCAST;

    default:
      return null;
  }
}
