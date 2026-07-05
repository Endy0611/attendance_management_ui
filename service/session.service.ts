/**
 * service/session.service.ts
 * Pure fetch wrapper. Does not read cookies/localStorage directly.
 *
 * GroupSessionController mixes wrapped and raw responses (see CLAUDE.md §5):
 * createSession/deleteSession/me-active/me-upcoming/me-history are wrapped
 * in ApiResponse<T>, while getAllSessions/getSession/updateSession/
 * getSessionsByGroup return the raw DTO/list. The request() helper below
 * detects the envelope shape per-call instead of hardcoding it per-endpoint.
 */

import type { GroupSessionRequest, GroupSessionResponse } from "@/types/session-types";

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
      tags: ["sessions"],
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

export const sessionService = {
  /** GET /api/v1/sessions — ADMIN only, every session in the system */
  list: (token: string) => request<GroupSessionResponse[]>("/sessions", token),

  /** GET /api/v1/sessions/group/{groupId} — ADMIN, INSTRUCTOR */
  byGroup: (groupId: string, token: string) =>
    request<GroupSessionResponse[]>(`/sessions/group/${groupId}`, token),

  /** GET /api/v1/sessions/{id} — ADMIN, INSTRUCTOR */
  get: (id: string, token: string) =>
    request<GroupSessionResponse>(`/sessions/${id}`, token),

  /** POST /api/v1/sessions — ADMIN, INSTRUCTOR */
  create: (body: GroupSessionRequest, token: string) =>
    request<GroupSessionResponse>("/sessions", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** PUT /api/v1/sessions/{id} — ADMIN, INSTRUCTOR */
  update: (id: string, body: GroupSessionRequest, token: string) =>
    request<GroupSessionResponse>(`/sessions/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /** DELETE /api/v1/sessions/{id} — ADMIN only */
  remove: (id: string, token: string) =>
    request<void>(`/sessions/${id}`, token, { method: "DELETE" }),

  /** GET /api/v1/sessions/me/active — any authenticated role, caller's groups */
  myActive: (token: string) =>
    request<GroupSessionResponse[]>("/sessions/me/active", token),

  /** GET /api/v1/sessions/me/upcoming — any authenticated role, caller's groups */
  myUpcoming: (token: string) =>
    request<GroupSessionResponse[]>("/sessions/me/upcoming", token),

  /** GET /api/v1/sessions/me/history — STUDENT, caller's enrolled groups */
  myHistory: (token: string) =>
    request<GroupSessionResponse[]>("/sessions/me/history", token),
};
