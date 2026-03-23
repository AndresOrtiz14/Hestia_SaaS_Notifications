export interface NotificationChannel {
  send(text: string): Promise<void>;
}
