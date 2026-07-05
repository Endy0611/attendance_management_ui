"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTokens } from "@/lib/server-auth";
import { deviceService } from "@/service/device.service";
import type { DeviceResponse } from "@/types/device-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const bindSchema = z.object({
  fingerprint: z.string().min(1, "Fingerprint is required"),
  deviceInfo: z.string().min(1, "Device info is required"),
});

async function requireToken(): Promise<ActionResult<string>> {
  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };
  return { ok: true, data: accessToken };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

/**
 * Returns the student's bound device, or `null` if none is bound yet.
 * GET /devices/me 404s when there's no device — that's an expected state for
 * a new student, not a real error, so we swallow it here rather than bubble
 * an error banner up to a page that just wants to know "bound or not".
 */
export async function getMyDeviceAction(): Promise<ActionResult<DeviceResponse | null>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const device = await deviceService.myDevice(auth.data);
    return { ok: true, data: device };
  } catch {
    return { ok: true, data: null };
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function bindDeviceAction(
  input: { fingerprint: string; deviceInfo: string }
): Promise<ActionResult<DeviceResponse>> {
  const parsed = bindSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const device = await deviceService.bind(parsed.data, auth.data);
    revalidatePath("/dashboard/security/device");
    revalidatePath("/dashboard/attendance/check-in");
    return { ok: true, data: device };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
