import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// PATCH /api/me/privacy — toggle private/public account
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const isPrivate = !!body.isPrivate;

  const updated = await db.user.update({
    where: { id: user.id },
    data: { isPrivate },
  });

  return NextResponse.json({ ok: true, isPrivate: updated.isPrivate });
}
