"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTokens } from "@/lib/server-auth";
import { attendanceService } from "@/service/attendance.service";
import type { AttendanceResponse } from "@/types/attendance-types";

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

// ─── Writes ──────────────────────────────────────────────────────────────────

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