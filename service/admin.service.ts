/**
 * admin.service.ts
 *
 * Raw calls to /admin/*. ADMIN-only on the backend for everything except
 * listUsers, which Groups also needs (read-only) for the instructor picker —
 * the backend endpoint itself is admin-gated, so this only works when called
 * with an admin token. If a non-admin instructor needs to see a small
 * instructor list one day, the backend needs a scoped endpoint; don't work
 * around that by loosening this service.
 */

import type {
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  ApiResponse,
  AppUserResponse,
} from "@/types/auth-types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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
  // ApiResponse envelope { success, message, payload }, others (e.g.
  // /admin/users) return the raw payload directly with no wrapper.
  // Only treat it as an envelope if it actually has that shape.
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

export const adminService = {
  /** GET /admin/users */
  listUsers: (token: string) => request<AppUserResponse[]>("/admin/users", token),

  /** GET /admin/users/{id} */
  getUser: (id: string, token: string) =>
    request<AppUserResponse>(`/admin/users/${id}`, token),

  /** POST /admin/users */
  createUser: (body: AdminCreateUserRequest, token: string) =>
    request<AppUserResponse>("/admin/users", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** PUT /admin/users/{id} */
  updateUser: (id: string, body: AdminUpdateUserRequest, token: string) =>
    request<AppUserResponse>(`/admin/users/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /** DELETE /admin/users/{id} */
  deleteUser: (id: string, token: string) =>
    request<void>(`/admin/users/${id}`, token, { method: "DELETE" }),

  /** PATCH /admin/users/{id}/role?role=INSTRUCTOR */
  changeRole: (id: string, role: string, token: string) =>
    request<void>(`/admin/users/${id}/role?role=${role}`, token, { method: "PATCH" }),

  /** PATCH /admin/users/{id}/active?active=true|false */
  setActive: (id: string, active: boolean, token: string) =>
    request<void>(`/admin/users/${id}/active?active=${active}`, token, { method: "PATCH" }),

  /** POST /admin/users/{id}/reset-password */
  resetPassword: (id: string, token: string) =>
    request<void>(`/admin/users/${id}/reset-password`, token, { method: "POST" }),

  /** POST /admin/users/{id}/device-reset */
  resetDevice: (id: string, token: string) =>
    request<void>(`/admin/users/${id}/device-reset`, token, { method: "POST" }),
};