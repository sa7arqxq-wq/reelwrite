import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSubscriptionInfo } from "@/lib/subscription";

// GET /api/me/subscription — returns current subscription info
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const info = await getSubscriptionInfo(user.id);
  return NextResponse.json(info);
}
