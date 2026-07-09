import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sanitizeText } from "@/lib/validation";

// GET /api/stories — get active stories (yours + people you follow)
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const now = new Date();

  // Get stories from yourself and people you follow
  const following = await db.follow.findMany({
    where: { followerId: user.id },
    select: { followeeId: true },
  });
  const followingIds = [...following.map((f) => f.followeeId), user.id];

  const stories = await db.story.findMany({
    where: {
      userId: { in: followingIds },
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  // Group by user
  const byUser = new Map<string, { user: any; stories: any[]; hasUnviewed: boolean }>();
  for (const s of stories) {
    const key = s.userId;
    if (!byUser.has(key)) {
      const viewedBy = JSON.parse(s.viewedBy || "[]") as string[];
      byUser.set(key, {
        user: {
          id: s.user.id,
          username: s.user.username,
          displayName: s.user.displayName,
          avatarColor: s.user.avatarColor,
          avatarEmoji: s.user.avatarEmoji,
          image: s.user.image,
        },
        stories: [],
        hasUnviewed: !viewedBy.includes(user.id),
      });
    }
    byUser.get(key)!.stories.push({
      id: s.id,
      text: s.text,
      mood: s.mood,
      background: s.background,
      backgroundImage: s.backgroundImage,
      createdAt: s.createdAt,
      viewed: (JSON.parse(s.viewedBy || "[]") as string[]).includes(user.id),
    });
  }

  return NextResponse.json({ stories: Array.from(byUser.values()) });
}

// POST /api/stories — create a new story
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const text = sanitizeText(body.text);
  if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });
  if (text.length > 500) return NextResponse.json({ error: "Story too long (max 500 chars)" }, { status: 400 });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  const story = await db.story.create({
    data: {
      userId: user.id,
      text,
      mood: body.mood || "amber",
      background: body.background || "mood",
      backgroundImage: body.backgroundImage || null,
      bookId: body.bookId || null,
      expiresAt,
    },
  });

  return NextResponse.json({ story });
}
