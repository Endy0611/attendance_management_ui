/**
 * app/api/auth/refresh/route.ts
 *
 * A Next.js Route Handler (API route) for token refresh.
 *
 * Why have this as an API route AND a server action?
 * → The server action is for server components / SSR flows.
 * → This API route lets client-side SWR hooks call it via fetch
 *   when a request fails with 401 — without needing a full page reload.
 *
 * POST /api/auth/refresh
 */

import { NextResponse } from "next/server";
import { refreshTokenServerAction } from "@/actions/auth-server.action";

export async function POST() {
  const result = await refreshTokenServerAction();

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({ accessToken: result.data.accessToken });
}