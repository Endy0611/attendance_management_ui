"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTokens } from "@/lib/server-auth";
import { zoneService } from "@/service/zone.service";
import type { ZoneResponse } from "@/types/zone-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const zoneSchema = z.object({
  name: z.string().min(1, "Zone name is required").max(150),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().min(1, "Radius must be positive").optional(),
});

async function requireToken(): Promise<ActionResult<string>> {
  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };
  return { ok: true, data: accessToken };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getZonesAction(): Promise<ActionResult<ZoneResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const zones = await zoneService.list(auth.data);
    return { ok: true, data: zones };
  } catch (e) {
    console.error("Backend fetch error inside getZonesAction:", e);
    return { ok: false, error: (e as Error).message };
  }
}

export async function getZoneAction(id: string): Promise<ActionResult<ZoneResponse>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const zone = await zoneService.get(id, auth.data);
    return { ok: true, data: zone };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function createZoneAction(
  input: { name: string; latitude?: number; longitude?: number; radiusMeters?: number }
): Promise<ActionResult<ZoneResponse>> {
  const parsed = zoneSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const zone = await zoneService.create(parsed.data, auth.data);
    revalidatePath("/dashboard/zones");
    return { ok: true, data: zone };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateZoneAction(
  id: string,
  input: { name: string; latitude?: number; longitude?: number; radiusMeters?: number }
): Promise<ActionResult<ZoneResponse>> {
  const parsed = zoneSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const zone = await zoneService.update(id, parsed.data, auth.data);
    revalidatePath("/dashboard/zones");
    return { ok: true, data: zone };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteZoneAction(id: string): Promise<ActionResult> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    await zoneService.remove(id, auth.data);
    revalidatePath("/dashboard/zones");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
