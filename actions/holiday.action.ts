"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTokens } from "@/lib/server-auth";
import { holidayService } from "@/service/holiday.service";
import type { HolidayResponse } from "@/types/holiday-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const holidaySchema = z.object({
  date: z.string().min(1, "Date is required"),
  name: z.string().min(1, "Name is required").max(150),
});

async function requireToken(): Promise<ActionResult<string>> {
  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };
  return { ok: true, data: accessToken };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getHolidaysAction(): Promise<ActionResult<HolidayResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const holidays = await holidayService.list(auth.data);
    return { ok: true, data: holidays };
  } catch (e) {
    console.error("Backend fetch error inside getHolidaysAction:", e);
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function createHolidayAction(
  input: { date: string; name: string }
): Promise<ActionResult<HolidayResponse>> {
  const parsed = holidaySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const holiday = await holidayService.create(parsed.data, auth.data);
    revalidatePath("/dashboard/holidays");
    revalidatePath("/dashboard/sessions");
    return { ok: true, data: holiday };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteHolidayAction(id: string): Promise<ActionResult> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    await holidayService.remove(id, auth.data);
    revalidatePath("/dashboard/holidays");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}