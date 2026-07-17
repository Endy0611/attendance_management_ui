export type NotificationType =
  | "CHECK_IN_SUCCESS"
  | "CHECK_IN_FAILED"
  | "CHECK_IN_HELP_REQUESTED"
  | "SESSION_STARTING"
  | "SESSION_ENDED"
  | "DEVICE_BOUND";

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}