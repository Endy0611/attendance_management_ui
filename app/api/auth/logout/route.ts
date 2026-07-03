/**
 * app/api/auth/logout/route.ts
 *
 * POST /api/auth/logout
 *
 * Client can call this via fetch to log out without a full page action.
 * Clears the HttpOnly cookies server-side (the only way to clear them).
 */

import { NextResponse } from "next/server";
import { logoutServerAction } from "@/actions/auth-server.action";

export async function POST() {
  // logoutServerAction clears cookies and calls redirect()
  // We catch the redirect and return a JSON response instead
  // so the client can handle navigation itself.
  try {
    await logoutServerAction();
  } catch {
    // Next.js redirect() throws internally — that's expected, ignore it
  }

  return NextResponse.json({ ok: true });
}