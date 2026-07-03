/**
 * service/timetable.service.ts
 * Pure fetch wrapper. Does not read cookies/localStorage directly.
 *
 * NOTE: TimetableSlotController is inconsistent about ApiResponse wrapping —
 * POST / and DELETE /{id} return an ApiResponse<T> envelope, while GET /{id},
 * GET /group/{groupId}, GET /me, and PUT /{id} return the raw DTO/list. The
 * two helpers below (requestRaw / requestWrapped) mirror that split so each
 * call unwraps exactly what its endpoint actually sends. Worth normalizing
 * on the backend at some point, but the frontend has to work with it as-is.
 */

import type { ApiResponse } from "@/types/auth-types";
import type { TimetableSlotRequest, TimetableSlotResponse } from "@/types/timetable-types";

// Matches backend base path (/api/v1) and port (8080)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

async function requestJson<T>(
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
    next: {
      tags: ["timetable-slots"],
    },
  });

  if (!res.ok) {
    let errorMessage = `Server error: ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson && errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Fallback if response body is empty or not JSON
    }
    throw new Error(errorMessage);
  }

  // DELETE / 204-style endpoints can return an empty body
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// Endpoints that return the DTO/list directly
function requestRaw<T>(path: string, token: string, options?: RequestInit) {
  return requestJson<T>(path, token, options);
}

// Endpoints that return { success, message, payload }
async function requestWrapped<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const data = await requestJson<ApiResponse<T>>(path, token, options);
  if (!data.success) {
    throw new Error(data.message ?? "Something went wrong");
  }
  return data.payload;
}

export const timetableService = {
  /** GET /timetable-slots/{id} — raw DTO. ADMIN or the owning INSTRUCTOR only. */
  get: (id: string, token: string) =>
    requestRaw<TimetableSlotResponse>(`/timetable-slots/${id}`, token),

  /** GET /timetable-slots/group/{groupId} — raw list. Any role. */
  forGroup: (groupId: string, token: string) =>
    requestRaw<TimetableSlotResponse[]>(`/timetable-slots/group/${groupId}`, token),

  /** GET /timetable-slots/me — raw list. Role-aware: admin/instructor/student. */
  mine: (token: string) =>
    requestRaw<TimetableSlotResponse[]>("/timetable-slots/me", token),

  /** POST /timetable-slots — ApiResponse-wrapped. */
  create: (body: TimetableSlotRequest, token: string) =>
    requestWrapped<TimetableSlotResponse>("/timetable-slots", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** PUT /timetable-slots/{id} — raw DTO. */
  update: (id: string, body: TimetableSlotRequest, token: string) =>
    requestRaw<TimetableSlotResponse>(`/timetable-slots/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /** DELETE /timetable-slots/{id} — ApiResponse-wrapped (payload is void). */
  remove: (id: string, token: string) =>
    requestWrapped<void>(`/timetable-slots/${id}`, token, { method: "DELETE" }),

  /** POST /timetable-slots/{id}/generate-sessions — ApiResponse-wrapped, payload is the count. */
  generateSessions: (id: string, token: string) =>
    requestWrapped<number>(`/timetable-slots/${id}/generate-sessions`, token, {
      method: "POST",
    }),
};