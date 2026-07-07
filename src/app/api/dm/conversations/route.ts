import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/dm/conversations — list current user's conversations
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const participations = await db.conversationParticipant.findMany({
    where: { userId: user.id },
    include: {
      conversation: {
        include: {
          participants: { include: { user: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  const conversations = participations.map((p) => {
    const otherParticipant = p.conversation.participants.find((pp) => pp.userId !== user.id);
    const lastMessage = p.conversation.messages[0];
    const unreadCount = lastMessage && lastMessage.senderId !== user.id && lastMessage.createdAt > p.lastReadAt;
    return {
      id: p.conversation.id,
      otherUser: otherParticipant?.user
        ? {
            id: otherParticipant.user.id,
            username: otherParticipant.user.username,
            displayName: otherParticipant.user.displayName,
            avatarColor: otherParticipant.user.avatarColor,
            avatarEmoji: otherParticipant.user.avatarEmoji,
            image: otherParticipant.user.image,
          }
        : null,
      lastMessage: lastMessage
        ? { text: lastMessage.text, createdAt: lastMessage.createdAt, senderId: lastMessage.senderId }
        : null,
      hasUnread: !!unreadCount,
    };
  });

  return NextResponse.json({ conversations });
}
