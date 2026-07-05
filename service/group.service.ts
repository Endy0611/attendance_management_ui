import type { ApiResponse } from "@/types/auth-types";
import type {
  AddGroupMembersRequest,
  GroupMemberResponse,
  GroupRequest,
  GroupResponse,
} from "@/types/group-types";

// Same fix as admin.service.ts / auth.service.ts — this was missing the
// /api/v1 version prefix that every other service file defaults with.
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

  const data = await res.json();

  // Backend is inconsistent: some endpoints wrap responses in an
  // ApiResponse envelope { success, message, payload }, others return
  // the raw payload directly with no wrapper. Only treat it as an
  // envelope if it actually has that shape.
  const isEnvelope =
    data && typeof data === "object" && !Array.isArray(data) && "success" in data;

  if (isEnvelope) {
    if (!res.ok || !(data as ApiResponse<T>).success) {
      throw new Error((data as ApiResponse<T>).message ?? `Backend error (${res.status})`);
    }
    return (data as ApiResponse<T>).payload;
  }

  if (!res.ok) {
    throw new Error(`Backend error (${res.status})`);
  }

  return data as T;
}

export const groupService = {
  /** GET /groups — ADMIN only, all groups */
  list: (token: string) => request<GroupResponse[]>("/groups", token),

  /** GET /groups/me — ADMIN sees all, INSTRUCTOR sees their own, STUDENT sees enrolled */
  mine: (token: string) => request<GroupResponse[]>("/groups/me", token),

  /** GET /groups/{id} */
  get: (id: string, token: string) => request<GroupResponse>(`/groups/${id}`, token),

  /** POST /groups */
  create: (body: GroupRequest, token: string) =>
    request<GroupResponse>("/groups", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** PUT /groups/{id} */
  update: (id: string, body: GroupRequest, token: string) =>
    request<GroupResponse>(`/groups/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /** DELETE /groups/{id} */
  remove: (id: string, token: string) =>
    request<void>(`/groups/${id}`, token, { method: "DELETE" }),

  /** GET /groups/{id}/members */
  members: (id: string, token: string) =>
    request<GroupMemberResponse[]>(`/groups/${id}/members`, token),

  /** POST /groups/{id}/members */
  addMembers: (id: string, body: AddGroupMembersRequest, token: string) =>
    request<GroupMemberResponse[]>(`/groups/${id}/members`, token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** DELETE /groups/{id}/members/{studentId} */
  removeMember: (id: string, studentId: string, token: string) =>
    request<void>(`/groups/${id}/members/${studentId}`, token, { method: "DELETE" }),
};