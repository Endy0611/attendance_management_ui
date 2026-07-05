/**
 * service/zone.service.ts
 * Pure fetch wrapper. Does not read cookies/localStorage directly.
 */

import type { ZoneRequest, ZoneResponse } from "@/types/zone-types";

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
      tags: ["zones"],
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => undefined);

  // Per the current OpenAPI spec (V5), ZoneController is inconsistent:
  // createZone (POST /) returns the ApiResponse<ZoneResponse> envelope,
  // while getZone/updateZone/getAllZones return the raw DTO/list with no
  // envelope. Only unwrap when the envelope shape is actually present.
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

export const zoneService = {
  /** GET /api/v1/zones — ADMIN only */
  list: (token: string) => request<ZoneResponse[]>("/zones", token),

  /** GET /api/v1/zones/{id} */
  get: (id: string, token: string) => request<ZoneResponse>(`/zones/${id}`, token),

  /** POST /api/v1/zones */
  create: (body: ZoneRequest, token: string) =>
    request<ZoneResponse>("/zones", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** PUT /api/v1/zones/{id} */
  update: (id: string, body: ZoneRequest, token: string) =>
    request<ZoneResponse>(`/zones/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /** DELETE /api/v1/zones/{id} */
  remove: (id: string, token: string) =>
    request<void>(`/zones/${id}`, token, { method: "DELETE" }),
};
