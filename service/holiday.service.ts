/**
 * service/holiday.service.ts
 * Pure fetch wrapper. Does not read cookies/localStorage directly.
 *
 * Backend addition (see CLAUDE.md §4a): university-wide blackout dates.
 * GET is ADMIN + INSTRUCTOR, POST/DELETE are ADMIN only — enforced again
 * here defensively, but the real gate is the backend's @PreAuthorize.
 */

import type { HolidayRequest, HolidayResponse } from "@/types/holiday-types";

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
    next: {
      tags: ["holidays"],
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => undefined);

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

export const holidayService = {
  /** GET /api/v1/holidays — ADMIN + INSTRUCTOR */
  list: (token: string) => request<HolidayResponse[]>("/holidays", token),

  /**
   * POST /api/v1/holidays — ADMIN only.
   * Retroactive: the backend immediately cancels + reschedules any
   * already-generated future sessions that land on this date.
   */
  create: (body: HolidayRequest, token: string) =>
    request<HolidayResponse>("/holidays", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /**
   * DELETE /api/v1/holidays/{id} — ADMIN only.
   * Not retroactive: run generate-sessions on the affected slot(s)
   * afterward if you want a session back on the now-unblocked date.
   */
  remove: (id: string, token: string) =>
    request<void>(`/holidays/${id}`, token, { method: "DELETE" }),
};