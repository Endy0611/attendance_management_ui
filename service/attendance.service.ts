/**
 * service/attendance.service.ts
 * Pure fetch wrapper. Does not read cookies/localStorage directly.
 */

import type { AttendanceCheckInRequest, AttendanceResponse } from "@/types/attendance-types";

// Matches backend base path (/api/v1) and port (8080)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => undefined);

  // AttendanceController wraps its responses in ApiResponse<T>
  // { success, message, payload, status, timestamp }.
  const isEnvelope =
    data && typeof data === "object" && !Array.isArray(data) && "success" in data;

  if (isEnvelope) {
    if (!res.ok || !data.success) {
      throw new Error(data.message ?? `Server error: ${res.status}`);
    }
    return data.payload as T;
  }

  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }

  return data as T;
}

export const attendanceService = {
  /** POST /api/v1/attendance/sessions/{sessionId}/check-in — STUDENT */
  checkIn: (sessionId: string, body: AttendanceCheckInRequest, token: string) =>
    request<AttendanceResponse>(`/attendance/sessions/${sessionId}/check-in`, token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /**
   * POST /api/v1/attendance/sessions/{sessionId}/request-help — STUDENT
   * Notifies the instructor/admin who created the session that this student
   * needs a manual override (used after repeated face-verification failures).
   */
  requestHelp: (sessionId: string, token: string) =>
    request<void>(`/attendance/sessions/${sessionId}/request-help`, token, {
      method: "POST",
    }),
};