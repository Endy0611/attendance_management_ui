
/**
 * service/face.service.ts
 * Pure fetch wrapper. Does not read cookies/localStorage directly.
 */

import type { FaceStatusResponse } from "@/types/face-types";

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
      tags: ["face"],
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

export const faceService = {
  /** GET /api/v1/faces/me/status */
  myStatus: (token: string) => request<FaceStatusResponse>("/faces/me/status", token),

  /** POST /api/v1/faces/register */
  register: (imageBase64: string, token: string) =>
    request<FaceStatusResponse>("/faces/register", token, {
      method: "POST",
      body: JSON.stringify({ imageBase64 }),
    }),

  /** DELETE /api/v1/faces/admin/{userId}/reset — ADMIN */
  adminReset: (userId: string, token: string) =>
    request<void>(`/faces/admin/${userId}/reset`, token, {
      method: "DELETE",
    }),
};