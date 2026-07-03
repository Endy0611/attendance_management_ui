// Inside app/api/auth/[...nextauth]/route.ts (or wherever you handle API sessions)
import { getUser } from "@/lib/server-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user });
}