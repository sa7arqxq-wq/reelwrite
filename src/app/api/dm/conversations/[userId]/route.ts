import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sanitizeText } from "@/lib/validation";

// GET /api/dm/conversations/[userId] — get or create a conversation with a user
export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { userId: otherUserId } = await params;
  if (otherUserId === user.id) {
    return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });
  }

  // Check if the other user exists
  const otherUser = await db.user.findUnique({ where: { id: otherUserId } });
  if (!otherUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check if private account — only allow if following
  if (otherUser.isPrivate) {
    const isFollowing = await db.follow.findUnique({
      where: { followerId_followeeId: { followerId: user.id, followeeId: otherUserId } },
    });
    if (!isFollowing && user.role !== "ADMIN") {
      return NextResponse.json({ error: "This account is private. Follow them to send a DM." }, { status: 403 });
    }
  }

  // Find existing conversation
  const existing = await db.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
    include: {
      participants: { include: { user: true } },
    },
  });

  if (existing) {
    return NextResponse.json({ conversationId: existing.id });
  }

  // Create new conversation
  const conversation = await db.conversation.create({
    data: {
      participants: {
        create: [
          { userId: user.id },
          { userId: otherUserId },
        ],
      },
    },
  });

  return NextResponse.json({ conversationId: conversation.id });
}
