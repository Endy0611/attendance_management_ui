"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTokens } from "@/lib/server-auth";
import { attendanceService } from "@/service/attendance.service";
import type {
  AttendanceResponse,
  AttendanceSummaryResponse,
  AbsentStudentResponse,
  StudentAttendanceResponse,
} from "@/types/attendance-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  deviceFingerprint: z.string().min(1, "Device fingerprint is required"),
  faceImageBase64: z.string().min(1, "A face capture is required"),
});

async function requireToken(): Promise<ActionResult<string>> {
  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };
  return { ok: true, data: accessToken };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

/** GET /attendance/sessions/{sessionId} — ADMIN / INSTRUCTOR */
export async function getSessionAttendanceAction(
  sessionId: string
): Promise<ActionResult<AttendanceResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const records = await attendanceService.bySession(sessionId, auth.data);
    return { ok: true, data: records };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** GET /attendance/sessions/{sessionId}/summary — ADMIN / INSTRUCTOR */
export async function getSessionSummaryAction(
  sessionId: string
): Promise<ActionResult<AttendanceSummaryResponse>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const summary = await attendanceService.summary(sessionId, auth.data);
    return { ok: true, data: summary };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** GET /attendance/sessions/{sessionId}/absent — ADMIN / INSTRUCTOR */
export async function getAbsentStudentsAction(
  sessionId: string
): Promise<ActionResult<AbsentStudentResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const absent = await attendanceService.absent(sessionId, auth.data);
    return { ok: true, data: absent };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** GET /attendance/me — STUDENT, raw check-in records */
export async function getMyAttendanceAction(): Promise<ActionResult<AttendanceResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const records = await attendanceService.myAttendance(auth.data);
    return { ok: true, data: records };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** GET /attendance/me/sessions — STUDENT, past sessions incl. group/course context */
export async function getMySessionHistoryAction(): Promise<
  ActionResult<StudentAttendanceResponse[]>
> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const history = await attendanceService.mySessionHistory(auth.data);
    return { ok: true, data: history };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────

/** PATCH /attendance/sessions/{sessionId}/students/{studentId} — ADMIN / INSTRUCTOR */
export async function manualOverrideAction(
  sessionId: string,
  studentId: string,
  status: "PRESENT" | "LATE" | "ABSENT"
): Promise<ActionResult<AttendanceResponse>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const updated = await attendanceService.manualOverride(sessionId, studentId, status, auth.data);
    revalidatePath("/dashboard/attendance/override");
    revalidatePath("/dashboard/attendance/session");
    return { ok: true, data: updated };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function checkInAction(
  sessionId: string,
  input: { latitude: number; longitude: number; deviceFingerprint: string; faceImageBase64: string }
): Promise<ActionResult<AttendanceResponse>> {
  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const attendance = await attendanceService.checkIn(sessionId, parsed.data, auth.data);
    revalidatePath("/dashboard/attendance/me");
    return { ok: true, data: attendance };
  } catch (e) {
    // Prints error details to your terminal hosting next dev
    console.error("Backend fetch error inside checkInAction:", e);
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Escalation path for repeated face-verification failures on check-in.
 * Notifies the instructor/admin who created the session — no device,
 * geofence, or face re-check here, this is a request for a human to look
 * at manualOverride(), not another automated attempt.
 */
export async function requestCheckInHelpAction(
  sessionId: string
): Promise<ActionResult<void>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    await attendanceService.requestHelp(sessionId, auth.data);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}