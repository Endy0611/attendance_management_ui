/**
 * service/course.service.ts
 * Pure fetch wrapper. Does not read cookies/localStorage directly.
 */

import type { CourseRequest, CourseResponse } from "@/types/course-types";

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
    // Next.js Tag-based caching for maximum performance
    next: {
      tags: ["courses"],
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => undefined);

  // Per the current OpenAPI spec (V5), every course-controller endpoint now
  // returns the ApiResponse<T> envelope { success, message, payload, status,
  // timestamp } — this used to be raw and was fixed here to match the spec.
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

export const courseService = {
  /** GET /api/v1/courses */
  list: (token: string) => request<CourseResponse[]>("/courses", token),

  /** GET /api/v1/courses/{id} */
  get: (id: string, token: string) =>
    request<CourseResponse>(`/courses/${id}`, token),

  /** POST /api/v1/courses */
  create: (body: CourseRequest, token: string) =>
    request<CourseResponse>("/courses", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** PUT /api/v1/courses/{id} */
  update: (id: string, body: CourseRequest, token: string) =>
    request<CourseResponse>(`/courses/${id}`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /** DELETE /api/v1/courses/{id} */
  remove: (id: string, token: string) =>
    request<void>(`/courses/${id}`, token, { method: "DELETE" }),
};