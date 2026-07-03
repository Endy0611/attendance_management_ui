"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache"; 
import { getTokens } from "@/lib/server-auth";
import { courseService } from "@/service/course.service";
import type { CourseResponse } from "@/types/course-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const courseSchema = z.object({
  code: z.string().min(1, "Course code is required").max(20),
  name: z.string().min(1, "Course name is required").max(150),
});

async function requireToken(): Promise<ActionResult<string>> {
  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };
  return { ok: true, data: accessToken };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getCoursesAction(): Promise<ActionResult<CourseResponse[]>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const courses = await courseService.list(auth.data);
    return { ok: true, data: courses };
  } catch (e) {
    // Prints error details to your terminal hosting next dev
    console.error("Backend fetch error inside getCoursesAction:", e);
    return { ok: false, error: (e as Error).message };
  }
}

export async function getCourseAction(id: string): Promise<ActionResult<CourseResponse>> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const course = await courseService.get(id, auth.data);
    return { ok: true, data: course };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function createCourseAction(
  input: { code: string; name: string }
): Promise<ActionResult<CourseResponse>> {
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const course = await courseService.create(parsed.data, auth.data);
    revalidatePath("/dashboard/courses"); 
    return { ok: true, data: course };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateCourseAction(
  id: string,
  input: { code: string; name: string }
): Promise<ActionResult<CourseResponse>> {
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    const course = await courseService.update(id, parsed.data, auth.data);
    revalidatePath("/dashboard/courses"); 
    return { ok: true, data: course };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteCourseAction(id: string): Promise<ActionResult> {
  const auth = await requireToken();
  if (!auth.ok) return auth;

  try {
    await courseService.remove(id, auth.data);
    revalidatePath("/dashboard/courses"); 
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}