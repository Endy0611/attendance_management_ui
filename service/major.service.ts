/**
 * service/major.service.ts
 * Pure fetch wrapper. Does not read cookies/localStorage directly.
 *
 * Unlike zone-controller/course-controller (which mix wrapped and raw
 * responses), MajorController is consistently wrapped: every endpoint
 * returns ApiResponse<T> — { success, message, payload, status, timestamp }.
 */

import type { MajorRequest, MajorResponse } from "@/types/major-types";

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
      tags: ["majors"],
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

export const majorService = {
  /** GET /api/v1/majors — any authenticated role */
  list: (token: string) => request<MajorResponse[]>("/majors", token),

  /** GET /api/v1/majors/{id} — any authenticated role */
  get: (id: string, token: string) => request<MajorResponse>(`/majors/${id}`, token),

  /** POST /api/v1/majors — ADMIN only */
  create: (body: MajorRequest, token: string) =>
    request<MajorResponse>("/majors", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** PUT /api/v1/majors/{id} — ADMIN only */
  update: (id: string, body: MajorRequest, token: string) =>
    request<MajorResponse>(`/majors/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /** DELETE /api/v1/majors/{id} — ADMIN only */
  remove: (id: string, token: string) =>
    request<void>(`/majors/${id}`, token, { method: "DELETE" }),
};
