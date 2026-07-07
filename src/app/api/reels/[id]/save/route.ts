import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { validateId } from "@/lib/validation";

// POST /api/reels/[id]/save — toggle save on a reel
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const idV = validateId(id);
  if (!idV.ok) return NextResponse.json({ error: idV.error }, { status: 400 });

  const reel = await db.reel.findUnique({ where: { id: idV.value } });
  if (!reel) return NextResponse.json({ error: "Reel not found" }, { status: 404 });

  const existing = await db.savedReel.findUnique({
    where: { userId_reelId: { userId: user.id, reelId: idV.value } },
  });

  if (existing) {
    await db.savedReel.delete({ where: { id: existing.id } });
    await db.reel.update({ where: { id: idV.value }, data: { saves: { decrement: 1 } } });
    return NextResponse.json({ ok: true, saved: false });
  } else {
    await db.savedReel.create({ data: { userId: user.id, reelId: idV.value } });
    await db.reel.update({ where: { id: idV.value }, data: { saves: { increment: 1 } } });
    return NextResponse.json({ ok: true, saved: true });
  }
}
