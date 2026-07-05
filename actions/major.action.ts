"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTokens } from "@/lib/server-auth";
import { majorService } from "@/service/major.service";
import type { MajorResponse } from "@/types/major-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const majorSchema = z.object({
  code: z.string().min(1, "Major code is required").max(20),
  name: z.string().min(1, "Major name is required").max(150),
});

async function requireToken(): Promise<ActionResult<string>> {
  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };
  return { ok: true, data: accessToken };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getMajorsAction(): Promise<ActionResult<MajorResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const majors = await majorService.list(auth.data);
    return { ok: true, data: majors };
  } catch (e) {
    console.error("Backend fetch error inside getMajorsAction:", e);
    return { ok: false, error: (e as Error).message };
  }
}

export async function getMajorAction(id: string): Promise<ActionResult<MajorResponse>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const major = await majorService.get(id, auth.data);
    return { ok: true, data: major };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function createMajorAction(
  input: { code: string; name: string }
): Promise<ActionResult<MajorResponse>> {
  const parsed = majorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const major = await majorService.create(parsed.data, auth.data);
    revalidatePath("/dashboard/majors");
    return { ok: true, data: major };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateMajorAction(
  id: string,
  input: { code: string; name: string }
): Promise<ActionResult<MajorResponse>> {
  const parsed = majorSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const major = await majorService.update(id, parsed.data, auth.data);
    revalidatePath("/dashboard/majors");
    return { ok: true, data: major };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteMajorAction(id: string): Promise<ActionResult> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    await majorService.remove(id, auth.data);
    revalidatePath("/dashboard/majors");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
