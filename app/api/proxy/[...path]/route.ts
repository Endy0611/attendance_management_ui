/**
 * app/api/proxy/[...path]/route.ts
 *
 * Every call in lib/api.ts hits this instead of the Spring Boot backend
 * directly. Reasoning: the access token is an httpOnly cookie on purpose
 * (server-auth.ts) so client JS can never read it — that's the whole
 * point of httpOnly. That means client components can never legally
 * attach `Authorization: Bearer <token>` themselves.
 *
 * This route reads the cookie server-side (where it's allowed) and
 * forwards the request to the real backend with the header attached,
 * then streams the response back. Same pattern already used by
 * app/api/auth/refresh and app/api/auth/logout.
 *
 * Excluded from proxy.ts's edge middleware matcher (`api/` is skipped),
 * so this never gets redirected — it always returns JSON/binary.
 *
 * Versioning: NEXT_PUBLIC_API_URL already includes the API version
 * (e.g. https://instantcheck.online/api/v1), and lib/api.ts also calls
 * this proxy with /api/v1/... in the path. To avoid double-prefixing
 * (/api/v1/api/v1/courses), we strip a leading /api/vN segment from
 * the incoming proxy path before appending it to BACKEND_URL. Bumping
 * the API version later is a one-line env var change — no code touches.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTokens } from "@/lib/server-auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9090/api/v1";

async function handle(req: NextRequest, path: string[]): Promise<NextResponse> {
  const { accessToken } = await getTokens();

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  const rawPath = "/" + path.join("/");
  // Strip a leading /api/vN so it isn't duplicated — BACKEND_URL already
  // carries the version prefix.
  const targetPath = rawPath.replace(/^\/api\/v\d+/, "");
  const url = `${BACKEND_URL}${targetPath}${req.nextUrl.search}`;

  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": req.headers.get("content-type") ?? "application/json",
    },
  };

  // Use arrayBuffer instead of text() — text() UTF-8 decodes/re-encodes
  // the body, which silently corrupts binary multipart/form-data payloads
  // (profile pictures, CV resumes, event images, CSV imports, etc).
  // arrayBuffer() forwards the raw bytes untouched.
  if (!["GET", "HEAD"].includes(req.method)) {
    const body = await req.arrayBuffer();
    if (body.byteLength > 0) init.body = body;
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(url, init);
  } catch {
    return NextResponse.json(
      { success: false, message: "Backend unreachable" },
      { status: 502 }
    );
  }

  const contentType = backendRes.headers.get("content-type") ?? "";

  // JSON responses (the vast majority — ApiResponse<T> envelope)
  if (contentType.includes("application/json")) {
    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  }

  // Binary passthrough (CSV/report exports)
  const buffer = await backendRes.arrayBuffer();
  const disposition = backendRes.headers.get("content-disposition");
  return new NextResponse(buffer, {
    status: backendRes.status,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      ...(disposition ? { "Content-Disposition": disposition } : {}),
    },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return handle(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: Ctx) {
  return handle(req, (await params).path);
}
export async function PUT(req: NextRequest, { params }: Ctx) {
  return handle(req, (await params).path);
}
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: Ctx) {
  return handle(req, (await params).path);
}