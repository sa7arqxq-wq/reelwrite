import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// DELETE /api/reels/[id]/delete — writer deletes their own reel
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const reel = await db.reel.findUnique({ where: { id } });
  if (!reel) return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  if (reel.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await db.like.deleteMany({ where: { reelId: id } });
  await db.comment.deleteMany({ where: { reelId: id } });
  await db.reel.delete({ where: { id } });

  await db.user.update({
    where: { id: reel.authorId },
    data: { reelsCount: { decrement: 1 } },
  });

  return NextResponse.json({ ok: true, id });
}
