import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/reels/[id]/like  body: { userId }  -> toggles like
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const userId = body.userId;
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const existing = await db.like.findUnique({
    where: { reelId_userId: { reelId: id, userId } },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    const reel = await db.reel.update({
      where: { id },
      data: { likes: { decrement: 1 } },
    });
    return NextResponse.json({ liked: false, likes: reel.likes });
  } else {
    await db.like.create({ data: { reelId: id, userId } });
    const reel = await db.reel.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
    return NextResponse.json({ liked: true, likes: reel.likes });
  }
}
