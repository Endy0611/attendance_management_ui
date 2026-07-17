"use server";

import { revalidatePath } from "next/cache";
import { getTokens } from "@/lib/server-auth";
import { notificationService } from "@/service/notification.service";
import type { NotificationResponse } from "@/types/notification-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireToken(): Promise<ActionResult<string>> {
  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };
  return { ok: true, data: accessToken };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getNotificationsAction(): Promise<ActionResult<NotificationResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const notifications = await notificationService.list(auth.data);
    return { ok: true, data: notifications };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function getUnreadNotificationCountAction(): Promise<ActionResult<number>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const count = await notificationService.unreadCount(auth.data);
    return { ok: true, data: count };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    await notificationService.markAllRead(auth.data);
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}