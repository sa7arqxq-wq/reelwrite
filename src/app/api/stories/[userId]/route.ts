import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/stories/[userId] — get stories for a specific user
export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { userId } = await params;
  const now = new Date();

  const stories = await db.story.findMany({
    where: { userId, expiresAt: { gt: now } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    stories: stories.map((s) => ({
      id: s.id,
      text: s.text,
      mood: s.mood,
      background: s.background,
      backgroundImage: s.backgroundImage,
      createdAt: s.createdAt,
      viewed: (JSON.parse(s.viewedBy || "[]") as string[]).includes(user.id),
    })),
  });
}
