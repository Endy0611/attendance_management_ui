
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTokens } from "@/lib/server-auth";
import { faceService } from "@/service/face.service";
import type { FaceStatusResponse } from "@/types/face-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const registerSchema = z.object({
  imageBase64: z.string().min(1, "A face capture is required"),
});

async function requireToken(): Promise<ActionResult<string>> {
  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };
  return { ok: true, data: accessToken };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

/**
 * Returns the caller's face registration status. Unlike device (which 404s
 * cleanly for "not bound yet"), a missing/failed status here still returns
 * a real error to the caller — a face-status lookup failing usually means
 * something's actually wrong (auth, backend down), not just "not registered
 * yet" (that case is faceRegistered: false, not an error).
 */
export async function getMyFaceStatusAction(): Promise<ActionResult<FaceStatusResponse | null>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const status = await faceService.myStatus(auth.data);
    return { ok: true, data: status };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function registerFaceAction(
  input: { imageBase64: string }
): Promise<ActionResult<FaceStatusResponse>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const status = await faceService.register(parsed.data.imageBase64, auth.data);
    revalidatePath("/dashboard/security/face");
    revalidatePath("/dashboard/attendance/check-in");
    return { ok: true, data: status };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function adminResetFaceAction(userId: string): Promise<ActionResult<void>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    await faceService.adminReset(userId, auth.data);
    revalidatePath("/dashboard/users");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}