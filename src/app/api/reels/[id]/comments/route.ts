import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reels/[id]/comments
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comments = await db.comment.findMany({
    where: { reelId: id },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  return NextResponse.json({ comments });
}

// POST /api/reels/[id]/comments  body: { userId, text }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { userId, text } = body;
  if (!userId || !text?.trim()) {
    return NextResponse.json({ error: "userId and text required" }, { status: 400 });
  }
  const comment = await db.comment.create({
    data: { reelId: id, userId, text: text.trim() },
    include: { user: true },
  });
  await db.reel.update({
    where: { id },
    data: { comments: { increment: 1 } },
  });
  return NextResponse.json({ comment });
}
