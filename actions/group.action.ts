"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getTokens } from "@/lib/server-auth";
import { groupService } from "@/service/group.service";
import { courseService } from "@/service/course.service";
import { adminService } from "@/service/admin.service";
import type { GroupMemberResponse, GroupResponse } from "@/types/group-types";
import type { CourseResponse } from "@/types/course-types";
import type { AppUserResponse } from "@/types/auth-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const groupSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  name: z.string().min(1, "Group name is required").max(150),
  instructorId: z.string().min(1, "Instructor is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  semester: z.string().optional(),
});

async function requireToken(): Promise<ActionResult<string>> {
  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };
  return { ok: true, data: accessToken };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

/** Scoped to the current user's role — ADMIN gets all, INSTRUCTOR gets their own. */
export async function getMyGroupsAction(): Promise<ActionResult<GroupResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const groups = await groupService.mine(auth.data);
    return { ok: true, data: groups };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function getGroupMembersAction(
  groupId: string
): Promise<ActionResult<GroupMemberResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const members = await groupService.members(groupId, auth.data);
    return { ok: true, data: members };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Feeds the course picker in the group form dialog. */
export async function getCourseOptionsAction(): Promise<ActionResult<CourseResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const courses = await courseService.list(auth.data);
    return { ok: true, data: courses };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Feeds the instructor picker — filtered to role INSTRUCTOR client-side. */
export async function getInstructorOptionsAction(): Promise<ActionResult<AppUserResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const users = await adminService.listUsers(auth.data);
    return { ok: true, data: users.filter((u) => u.role === "INSTRUCTOR") };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Feeds the "add member" picker — filtered to role STUDENT, excluding existing members. */
export async function getStudentOptionsAction(): Promise<ActionResult<AppUserResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const users = await adminService.listUsers(auth.data);
    return { ok: true, data: users.filter((u) => u.role === "STUDENT") };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function createGroupAction(input: {
  courseId: string;
  name: string;
  instructorId: string;
  capacity: number;
  semester?: string;
}): Promise<ActionResult<GroupResponse>> {
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const group = await groupService.create(parsed.data, auth.data);
    revalidatePath("/dashboard/groups");
    return { ok: true, data: group };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateGroupAction(
  id: string,
  input: { courseId: string; name: string; instructorId: string; capacity: number; semester?: string }
): Promise<ActionResult<GroupResponse>> {
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const group = await groupService.update(id, parsed.data, auth.data);
    revalidatePath("/dashboard/groups");
    return { ok: true, data: group };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteGroupAction(id: string): Promise<ActionResult> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    await groupService.remove(id, auth.data);
    revalidatePath("/dashboard/groups");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function addGroupMembersAction(
  groupId: string,
  studentIds: string[]
): Promise<ActionResult<GroupMemberResponse[]>> {
  if (studentIds.length === 0) return { ok: false, error: "Select at least one student" };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const members = await groupService.addMembers(groupId, { studentIds }, auth.data);
    revalidatePath("/dashboard/groups");
    return { ok: true, data: members };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function removeGroupMemberAction(
  groupId: string,
  studentId: string
): Promise<ActionResult> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    await groupService.removeMember(groupId, studentId, auth.data);
    revalidatePath("/dashboard/groups");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}