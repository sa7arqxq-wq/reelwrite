import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateId, validateComment } from "@/lib/validation";

// GET /api/reels/[id]/comments — returns comments with nested replies
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idV = validateId(id);
  if (!idV.ok) return NextResponse.json({ error: idV.error }, { status: 400 });

  // Get all comments for this reel (including replies)
  const allComments = await db.comment.findMany({
    where: { reelId: idV.value },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });

  // Build nested structure: top-level comments with their replies
  const topLevel = allComments.filter((c) => !c.parentCommentId);
  const repliesByParent = new Map<string, typeof allComments>();
  for (const c of allComments) {
    if (c.parentCommentId) {
      const existing = repliesByParent.get(c.parentCommentId) || [];
      existing.push(c);
      repliesByParent.set(c.parentCommentId, existing);
    }
  }

  const comments = topLevel.map((c) => ({
    id: c.id,
    text: c.text,
    createdAt: c.createdAt.toISOString(),
    parentCommentId: c.parentCommentId,
    user: {
      id: c.user.id,
      username: c.user.username,
      displayName: c.user.displayName,
      avatarColor: c.user.avatarColor,
      avatarEmoji: c.user.avatarEmoji,
      image: c.user.image,
    },
    replies: (repliesByParent.get(c.id) || []).map((r) => ({
      id: r.id,
      text: r.text,
      createdAt: r.createdAt.toISOString(),
      parentCommentId: r.parentCommentId,
      user: {
        id: r.user.id,
        username: r.user.username,
        displayName: r.user.displayName,
        avatarColor: r.user.avatarColor,
        avatarEmoji: r.user.avatarEmoji,
        image: r.user.image,
      },
    })),
  }));

  return NextResponse.json({ comments });
}

// POST /api/reels/[id]/comments  body: { userId, text, parentCommentId? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reelIdV = validateId(id);
  if (!reelIdV.ok) return NextResponse.json({ error: reelIdV.error }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const { userId, text, parentCommentId } = body;

  const userIdV = validateId(userId);
  if (!userIdV.ok) return NextResponse.json({ error: userIdV.error }, { status: 400 });

  const textV = validateComment(text);
  if (!textV.ok) return NextResponse.json({ error: textV.error }, { status: 400 });

  const reel = await db.reel.findUnique({ where: { id: reelIdV.value } });
  if (!reel) return NextResponse.json({ error: "Reel not found" }, { status: 404 });

  const user = await db.user.findUnique({ where: { id: userIdV.value } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.banned) return NextResponse.json({ error: "Account is banned" }, { status: 403 });

  // Validate parentCommentId if provided (it's a reply)
  let parentId: string | null = null;
  if (parentCommentId) {
    const parentV = validateId(parentCommentId);
    if (!parentV.ok) return NextResponse.json({ error: parentV.error }, { status: 400 });
    // Verify parent comment exists and belongs to the same reel
    const parent = await db.comment.findUnique({ where: { id: parentV.value } });
    if (!parent || parent.reelId !== reelIdV.value) {
      return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
    }
    parentId = parentV.value;
  }

  const comment = await db.comment.create({
    data: {
      reelId: reelIdV.value,
      userId: userIdV.value,
      text: textV.value,
      parentCommentId: parentId,
    },
    include: { user: true },
  });

  // Only increment reel comment count for top-level comments (not replies)
  if (!parentId) {
    await db.reel.update({
      where: { id: reelIdV.value },
      data: { comments: { increment: 1 } },
    });
  }

  return NextResponse.json({
    comment: {
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      parentCommentId: comment.parentCommentId,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        displayName: comment.user.displayName,
        avatarColor: comment.user.avatarColor,
        avatarEmoji: comment.user.avatarEmoji,
        image: comment.user.image,
      },
    },
  });
}
