import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/admin/users/[id]/upgrade — manually upgrade/downgrade a user
// body: { action: "upgrade" | "downgrade", months?: number }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getSessionUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const months = body.months || 1;

  if (body.action === "upgrade") {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + months);
    const user = await db.user.update({
      where: { id },
      data: { subscriptionTier: "PRO", subscriptionExpires: expires },
    });
    return NextResponse.json({ ok: true, tier: user.subscriptionTier, expires: user.subscriptionExpires });
  }

  if (body.action === "downgrade") {
    const user = await db.user.update({
      where: { id },
      data: { subscriptionTier: "FREE", subscriptionExpires: null },
    });
    return NextResponse.json({ ok: true, tier: user.subscriptionTier });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
