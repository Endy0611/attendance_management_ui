// lib/api.ts — typed fetch helper for every backend endpoint
//
// Calls go through our own /api/proxy/* route instead of hitting the Spring
// Boot backend directly. The access token is an httpOnly cookie (by design —
// see lib/server-auth.ts), so client JS can never read it to attach an
// Authorization header itself. The proxy reads the cookie server-side and
// forwards the request instead.

import { useAuthStore } from "@/store/auth.store"

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const doFetch = () =>
    fetch(`/api/proxy${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    })

  let res = await doFetch()

  if (res.status === 401) {
    // Access token expired — try a silent refresh, then retry once.
    const refreshRes = await fetch("/api/auth/refresh", { method: "POST" })
    if (refreshRes.ok) {
      res = await doFetch()
    }
    if (!refreshRes.ok || res.status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = "/login"
      throw new Error("Session expired. Please log in again.")
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message ?? `HTTP ${res.status}`)
  }

  if (res.status === 204) {
    return undefined as T
  }

  const data = await res.json()

  // Backend is inconsistent: some endpoints return the raw payload
  // directly (e.g. /api/v1/courses → Course[]), others wrap it in an
  // ApiResponse envelope { success, message, payload, status, timestamp }
  // (e.g. /api/v1/sessions/me/active). Detect and unwrap accordingly.
  if (data && typeof data === "object" && "payload" in data && "success" in data) {
    return data.payload as T
  }

  return data as T
}

async function download(path: string, filename: string) {
  const res = await fetch(`/api/proxy${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string; name: string; email: string; phone: string | null
  studentId: string | null; generation: number | null
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT"
  avatar: string | null; verified: boolean; active: boolean
  deviceBound: boolean; faceRegistered?: boolean; firstLogin: boolean; createdAt: string
}

export interface Course {
  id: string; code: string; name: string
  groupCount: number; createdAt: string
}

export interface Zone {
  id: string; name: string; latitude: number; longitude: number
  radiusMeters: number; createdBy: string; createdByName: string; createdAt: string
}

export interface Group {
  id: string; courseId: string; courseCode: string; name: string
  instructorId: string; instructorName: string
  capacity: number | null; memberCount: number; semester: string | null; createdAt: string
}

export interface GroupMember {
  studentId: string; studentName: string; studentEmail: string
  studentNumber: string; joinedAt: string
}

export interface Session {
  id: string; groupId: string; groupName: string; courseCode: string
  zoneId: string; zoneName: string
  latitude: number; longitude: number; radiusMeters: number
  startTime: string; endTime: string; active: boolean; createdAt: string
}

export interface Attendance {
  attendanceId: string; sessionId: string; studentId: string; studentName: string
  checkedInAt: string; latitude: number; longitude: number
  distanceMeters: number; status: "PRESENT" | "LATE" | "ABSENT"
}

export interface AbsentStudent {
  studentId: string; studentName: string; studentEmail: string; studentNumber: string
}

export interface AttendanceSummary {
  sessionId: string; totalStudents: number; present: number; late: number; absent: number
}

export interface StudentAttendance {
  attendanceId: string; sessionId: string; sessionTitle: string
  groupName: string; courseCode: string
  status: "PRESENT" | "LATE" | "ABSENT"; checkedInAt: string | null
}

export interface FaceStatus { userId: string; faceRegistered: boolean; registeredAt: string | null }
export interface FaceVerify { matched: boolean; similarity: number }
export interface Device { id: string; deviceInfo: string; createdAt: string }
export interface AppNotification {
  id: string; type: string; title: string; message: string; read: boolean; createdAt: string
}
export interface FileMetaData {
  fileName: string; fileType: string; fileUrl: string; fileSize: number
}

// ── API modules ───────────────────────────────────────────────────────────────

export const adminApi = {
  listUsers:     ()                           => request<AppUser[]>("/api/v1/admin/users"),
  getUser:       (id: string)                 => request<AppUser>(`/api/v1/admin/users/${id}`),
  createUser:    (body: object)               => request<AppUser>("/api/v1/admin/users", { method: "POST", body: JSON.stringify(body) }),
  updateUser:    (id: string, body: object)   => request<AppUser>(`/api/v1/admin/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteUser:    (id: string)                 => request<void>(`/api/v1/admin/users/${id}`, { method: "DELETE" }),
  changeRole:    (id: string, role: string)   => request<void>(`/api/v1/admin/users/${id}/role?role=${role}`, { method: "PATCH" }),
  resetPassword: (id: string)                 => request<void>(`/api/v1/admin/users/${id}/reset-password`, { method: "POST" }),
  setActive:     (id: string, active: boolean)=> request<void>(`/api/v1/admin/users/${id}/active?active=${active}`, { method: "PATCH" }),
  resetDevice:   (id: string)                 => request<void>(`/api/v1/admin/users/${id}/device-reset`, { method: "PATCH" }),
}

export const courseApi = {
  list:   ()                          => request<Course[]>("/api/v1/courses"),
  get:    (id: string)                => request<Course>(`/api/v1/courses/${id}`),
  create: (body: object)              => request<Course>("/api/v1/courses", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object)  => request<Course>(`/api/v1/courses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string)                => request<void>(`/api/v1/courses/${id}`, { method: "DELETE" }),
}

export const zoneApi = {
  list:   ()                          => request<Zone[]>("/api/v1/zones"),
  get:    (id: string)                => request<Zone>(`/api/v1/zones/${id}`),
  create: (body: object)              => request<Zone>("/api/v1/zones", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: object)  => request<Zone>(`/api/v1/zones/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string)                => request<void>(`/api/v1/zones/${id}`, { method: "DELETE" }),
}

export const groupApi = {
  list:         ()                              => request<Group[]>("/api/v1/groups"),
  myGroups:     ()                              => request<Group[]>("/api/v1/groups/me"),
  get:          (id: string)                    => request<Group>(`/api/v1/groups/${id}`),
  create:       (body: object)                  => request<Group>("/api/v1/groups", { method: "POST", body: JSON.stringify(body) }),
  update:       (id: string, body: object)      => request<Group>(`/api/v1/groups/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove:       (id: string)                    => request<void>(`/api/v1/groups/${id}`, { method: "DELETE" }),
  listMembers:  (id: string)                    => request<GroupMember[]>(`/api/v1/groups/${id}/members`),
  addMembers:   (id: string, body: object)      => request<GroupMember[]>(`/api/v1/groups/${id}/members`, { method: "POST", body: JSON.stringify(body) }),
  removeMember: (groupId: string, studentId: string) => request<void>(`/api/v1/groups/${groupId}/members/${studentId}`, { method: "DELETE" }),
}

export const sessionApi = {
  list:      ()                         => request<Session[]>("/api/v1/sessions"),
  byGroup:   (groupId: string)          => request<Session[]>(`/api/v1/sessions/group/${groupId}`),
  get:       (id: string)               => request<Session>(`/api/v1/sessions/${id}`),
  create:    (body: object)             => request<Session>("/api/v1/sessions", { method: "POST", body: JSON.stringify(body) }),
  update:    (id: string, body: object) => request<Session>(`/api/v1/sessions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove:    (id: string)               => request<void>(`/api/v1/sessions/${id}`, { method: "DELETE" }),
  myActive:  ()                         => request<Session[]>("/api/v1/sessions/me/active"),
  myHistory: ()                         => request<Session[]>("/api/v1/sessions/me/history"),
  myAll:     ()                         => request<Session[]>("/api/v1/sessions/me/all"),
}

export const attendanceApi = {
  bySession: (sessionId: string)                              => request<Attendance[]>(`/api/v1/attendance/sessions/${sessionId}`),
  absent:    (sessionId: string)                              => request<AbsentStudent[]>(`/api/v1/attendance/sessions/${sessionId}/absent`),
  summary:   (sessionId: string)                             => request<AttendanceSummary>(`/api/v1/attendance/sessions/${sessionId}/summary`),
  override:  (sessionId: string, studentId: string, status: string) =>
               request<Attendance>(`/api/v1/attendance/sessions/${sessionId}/students/${studentId}?status=${status}`, { method: "PATCH" }),
  checkIn:   (sessionId: string, body: object)               => request<Attendance>(`/api/v1/attendance/sessions/${sessionId}/check-in`, { method: "POST", body: JSON.stringify(body) }),
  myRecords: ()                                              => request<Attendance[]>("/api/v1/attendance/me"),
  mySessions:()                                              => request<StudentAttendance[]>("/api/v1/attendance/me/sessions"),
}

export const faceApi = {
  register:   (imageBase64: string) => request<FaceStatus>("/api/v1/faces/register", { method: "POST", body: JSON.stringify({ imageBase64 }) }),
  verify:     (imageBase64: string) => request<FaceVerify>("/api/v1/faces/verify", { method: "POST", body: JSON.stringify({ imageBase64 }) }),
  myStatus:   ()                    => request<FaceStatus>("/api/v1/faces/me/status"),
  adminReset: (userId: string)      => request<void>(`/api/v1/faces/admin/${userId}/reset`, { method: "DELETE" }),
}

export const deviceApi = {
  bind:     (body: object) => request<Device>("/api/v1/devices/bind", { method: "POST", body: JSON.stringify(body) }),
  myDevice: ()             => request<Device>("/api/v1/devices/me"),
}

export const notificationApi = {
  list:        () => request<AppNotification[]>("/api/v1/notifications/me"),
  unreadCount: () => request<number>("/api/v1/notifications/me/unread-count"),
  markAllRead: () => request<void>("/api/v1/notifications/me/read-all", { method: "PATCH" }),
}

export const reportApi = {
  exportSession: (sessionId: string) => download(`/api/v1/reports/sessions/${sessionId}/export`, `session-${sessionId}.csv`),
  exportGroup:   (groupId: string)   => download(`/api/v1/reports/groups/${groupId}/export`, `group-${groupId}.csv`),
}