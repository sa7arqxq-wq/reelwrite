import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sanitizeText } from "@/lib/validation";

// GET /api/dm/conversations/[id]/messages — get all messages in a conversation
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  // Verify user is a participant
  const participation = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
  });
  if (!participation) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const messages = await db.directMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: true },
  });

  // Mark as read
  await db.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      text: m.text,
      createdAt: m.createdAt,
      senderId: m.senderId,
      sender: {
        id: m.sender.id,
        username: m.sender.username,
        displayName: m.sender.displayName,
        avatarColor: m.sender.avatarColor,
        avatarEmoji: m.sender.avatarEmoji,
        image: m.sender.image,
      },
    })),
  });
}

// POST /api/dm/conversations/[id]/messages — send a message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const text = sanitizeText(body.text);
  if (!text) return NextResponse.json({ error: "Message text required" }, { status: 400 });
  if (text.length > 1000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  // Verify user is a participant
  const participation = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
  });
  if (!participation) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const message = await db.directMessage.create({
    data: { conversationId: id, senderId: user.id, text },
    include: { sender: true },
  });

  // Update conversation timestamp
  await db.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json({
    message: {
      id: message.id,
      text: message.text,
      createdAt: message.createdAt,
      senderId: message.senderId,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        displayName: message.sender.displayName,
        avatarColor: message.sender.avatarColor,
        avatarEmoji: message.sender.avatarEmoji,
        image: message.sender.image,
      },
    },
  });
}
