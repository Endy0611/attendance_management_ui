export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface TimetableSlotResponse {
  id: string;
  groupId: string;
  groupName: string | null;
  courseCode: string | null;
  instructorName: string | null;
  zoneId: string;
  zoneName: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm:ss"
  endTime: string; // "HH:mm:ss"
  validFrom: string; // "YYYY-MM-DD"
  totalSessions: number;
  generatedSessionsCount: number;
  createdAt: string;
}

export interface TimetableSlotRequest {
  groupId: string;
  zoneId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  validFrom: string; // "YYYY-MM-DD"
  totalSessions: number;
}