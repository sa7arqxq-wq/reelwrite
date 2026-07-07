import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/reels/[id]/archive — toggle archive on a reel
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const reel = await db.reel.findUnique({ where: { id } });
  if (!reel) return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  if (reel.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const updated = await db.reel.update({
    where: { id },
    data: { archived: !reel.archived },
  });
  return NextResponse.json({ ok: true, archived: updated.archived });
}
