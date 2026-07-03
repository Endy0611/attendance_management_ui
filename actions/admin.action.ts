"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTokens, getUser } from "@/lib/server-auth";
import { adminService } from "@/service/admin.service";
import type { AppUserResponse } from "@/types/auth-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  phone: z.string().optional(),
  studentId: z.string().optional(),
  generation: z.number().int().optional(),
  role: z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"]),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  studentId: z.string().optional(),
  generation: z.number().int().optional(),
});

const roleSchema = z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"]);

/**
 * Every /admin/* backend route is ADMIN-gated, so a valid token alone isn't
 * enough — resolve the current user's session and check their role here.
 * A non-admin with a valid token gets a clean "Admin access required"
 * instead of a raw 403 bubbled up from the backend as a generic error.
 */
async function requireAdmin(): Promise<
  ActionResult<{ token: string; user: AppUserResponse }>
> {
  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };

  const user = await getUser();
  if (!user) return { ok: false, error: "Session expired — please log in again" };
  if (user.role !== "ADMIN") return { ok: false, error: "Admin access required" };

  return { ok: true, data: { token: accessToken, user } };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getUsersAction(): Promise<ActionResult<AppUserResponse[]>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  try {
    const users = await adminService.listUsers(auth.data.token);
    return { ok: true, data: users };
  } catch (e) {
    console.error("Backend fetch error inside getUsersAction:", e);
    return { ok: false, error: (e as Error).message };
  }
}

export async function getUserAction(id: string): Promise<ActionResult<AppUserResponse>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  try {
    const user = await adminService.getUser(id, auth.data.token);
    return { ok: true, data: user };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function createUserAction(input: {
  name: string;
  email: string;
  phone?: string;
  studentId?: string;
  generation?: number;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
}): Promise<ActionResult<AppUserResponse>> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  try {
    const user = await adminService.createUser(parsed.data, auth.data.token);
    revalidatePath("/dashboard/users");
    return { ok: true, data: user };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateUserAction(
  id: string,
  input: { name: string; phone?: string; studentId?: string; generation?: number }
): Promise<ActionResult<AppUserResponse>> {
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  try {
    const user = await adminService.updateUser(id, parsed.data, auth.data.token);
    revalidatePath("/dashboard/users");
    return { ok: true, data: user };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  try {
    await adminService.deleteUser(id, auth.data.token);
    revalidatePath("/dashboard/users");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function changeUserRoleAction(id: string, role: string): Promise<ActionResult> {
  const parsedRole = roleSchema.safeParse(role);
  if (!parsedRole.success) return { ok: false, error: "Invalid role" };

  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  // Guard against an admin locking themselves out of the admin panel.
  if (id === auth.data.user.id && parsedRole.data !== "ADMIN") {
    return { ok: false, error: "You can't change your own role" };
  }

  try {
    await adminService.changeRole(id, parsedRole.data, auth.data.token);
    revalidatePath("/dashboard/users");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setUserActiveAction(id: string, active: boolean): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  if (id === auth.data.user.id && !active) {
    return { ok: false, error: "You can't deactivate your own account" };
  }

  try {
    await adminService.setActive(id, active, auth.data.token);
    revalidatePath("/dashboard/users");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function resetUserPasswordAction(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  try {
    await adminService.resetPassword(id, auth.data.token);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function resetUserDeviceAction(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  try {
    await adminService.resetDevice(id, auth.data.token);
    revalidatePath("/dashboard/users");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
