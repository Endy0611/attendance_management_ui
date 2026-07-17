export interface HolidayResponse {
  id: string;
  date: string; // LocalDate, e.g. "2026-04-13"
  name: string;
  createdBy: string;
  createdAt: string; // Instant
}

export interface HolidayRequest {
  date: string;
  name: string;
}