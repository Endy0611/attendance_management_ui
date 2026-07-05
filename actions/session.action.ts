"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTokens, getUser } from "@/lib/server-auth";
import { sessionService } from "@/service/session.service";
import type { GroupSessionResponse } from "@/types/session-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const sessionSchema = z.object({
  groupId: z.string().min(1, "Group is required"),
  zoneId: z.string().min(1, "Zone is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

async function requireToken(): Promise<ActionResult<string>> {
  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };
  return { ok: true, data: accessToken };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

/**
 * Role-aware session list for the Sessions page.
 * ADMIN uses GET /sessions (every session). There is no equivalent "all
 * sessions for my groups" endpoint for INSTRUCTOR/STUDENT (the old frontend
 * called a non-existent /sessions/me/all and 404'd) — so for everyone else
 * we merge /me/active and /me/upcoming, which together cover every session
 * that hasn't ended yet for the caller's groups.
 */
export async function getSessionsForRoleAction(): Promise<ActionResult<GroupSessionResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  const user = await getUser();

  try {
    if (user?.role === "ADMIN") {
      const sessions = await sessionService.list(auth.data);
      return { ok: true, data: sessions };
    }

    const [active, upcoming] = await Promise.all([
      sessionService.myActive(auth.data),
      sessionService.myUpcoming(auth.data),
    ]);
    const byId = new Map<string, GroupSessionResponse>();
    for (const s of [...active, ...upcoming]) byId.set(s.id, s);
    return { ok: true, data: Array.from(byId.values()) };
  } catch (e) {
    console.error("Backend fetch error inside getSessionsForRoleAction:", e);
    return { ok: false, error: (e as Error).message };
  }
}

export async function getSessionsByGroupAction(
  groupId: string
): Promise<ActionResult<GroupSessionResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const sessions = await sessionService.byGroup(groupId, auth.data);
    return { ok: true, data: sessions };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** GET /api/v1/sessions/me/active — used by the student check-in flow */
export async function getMyActiveSessionsAction(): Promise<ActionResult<GroupSessionResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const sessions = await sessionService.myActive(auth.data);
    return { ok: true, data: sessions };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function createSessionAction(
  input: { groupId: string; zoneId: string; startTime: string; endTime: string }
): Promise<ActionResult<GroupSessionResponse>> {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const session = await sessionService.create(parsed.data, auth.data);
    revalidatePath("/dashboard/sessions");
    return { ok: true, data: session };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateSessionAction(
  id: string,
  input: { groupId: string; zoneId: string; startTime: string; endTime: string }
): Promise<ActionResult<GroupSessionResponse>> {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const session = await sessionService.update(id, parsed.data, auth.data);
    revalidatePath("/dashboard/sessions");
    return { ok: true, data: session };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteSessionAction(id: string): Promise<ActionResult> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    await sessionService.remove(id, auth.data);
    revalidatePath("/dashboard/sessions");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
