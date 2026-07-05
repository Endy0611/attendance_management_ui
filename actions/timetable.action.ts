"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTokens } from "@/lib/server-auth";
import { timetableService } from "@/service/timetable-service";
import type { TimetableSlotResponse, DayOfWeek } from "@/types/timetable-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const DAYS: DayOfWeek[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timetableSchema = z
  .object({
    groupId: z.string().min(1, "Group is required"),
    zoneId: z.string().min(1, "Zone is required"),
    dayOfWeek: z.enum(DAYS as [DayOfWeek, ...DayOfWeek[]]),
    startTime: z.string().regex(timeRegex, "Start time must be HH:mm"),
    endTime: z.string().regex(timeRegex, "End time must be HH:mm"),
    validFrom: z.string().min(1, "Start date is required"),
    totalSessions: z
      .number()
      .int()
      .min(1, "Must generate at least 1 session")
      .max(52, "Keep it to 52 sessions (one year) or fewer per slot"),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

async function requireToken(): Promise<ActionResult<string>> {
  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };
  return { ok: true, data: accessToken };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

/** GET /timetable-slots/me — role-aware: ADMIN sees all, INSTRUCTOR their own groups, STUDENT their enrolled groups. */
export async function getTimetableForRoleAction(): Promise<ActionResult<TimetableSlotResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const slots = await timetableService.mine(auth.data);
    return { ok: true, data: slots };
  } catch (e) {
    console.error("Backend fetch error inside getTimetableForRoleAction:", e);
    return { ok: false, error: (e as Error).message };
  }
}

export async function getTimetableSlotsByGroupAction(
  groupId: string
): Promise<ActionResult<TimetableSlotResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const slots = await timetableService.forGroup(groupId, auth.data);
    return { ok: true, data: slots };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function createTimetableSlotAction(
  input: z.infer<typeof timetableSchema>
): Promise<ActionResult<TimetableSlotResponse>> {
  const parsed = timetableSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const slot = await timetableService.create(parsed.data, auth.data);
    revalidatePath("/dashboard/timetable");
    return { ok: true, data: slot };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateTimetableSlotAction(
  id: string,
  input: z.infer<typeof timetableSchema>
): Promise<ActionResult<TimetableSlotResponse>> {
  const parsed = timetableSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const slot = await timetableService.update(id, parsed.data, auth.data);
    revalidatePath("/dashboard/timetable");
    return { ok: true, data: slot };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteTimetableSlotAction(id: string): Promise<ActionResult> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    await timetableService.remove(id, auth.data);
    revalidatePath("/dashboard/timetable");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * POST /timetable-slots/{id}/generate-sessions — the actual "auto-create every
 * Monday" step. Backend walks forward from validFrom, one slot per matching
 * weekday, until totalSessions real GroupSession rows exist for this slot.
 * Safe to call again later (e.g. next semester) — it only tops up the
 * difference between totalSessions and generatedSessionsCount rather than
 * duplicating what's already been generated.
 */
export async function generateSessionsAction(id: string): Promise<ActionResult<number>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const count = await timetableService.generateSessions(id, auth.data);
    revalidatePath("/dashboard/timetable");
    revalidatePath("/dashboard/sessions");
    return { ok: true, data: count };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}