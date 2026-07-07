import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// GET /api/me/saved — returns the current user's saved reels
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const saved = await db.savedReel.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      reel: {
        include: { author: true, book: true },
      },
    },
  });

  return NextResponse.json({
    reels: saved.map((s) => ({
      id: s.reel.id,
      hook: s.reel.hook,
      mood: s.reel.mood,
      background: s.reel.background,
      backgroundImage: s.reel.backgroundImage,
      videoUrl: s.reel.videoUrl,
      likes: s.reel.likes,
      comments: s.reel.comments,
      views: s.reel.views,
      archived: s.reel.archived,
      savedAt: s.createdAt.toISOString(),
      author: {
        id: s.reel.author.id,
        username: s.reel.author.username,
        displayName: s.reel.author.displayName,
        avatarColor: s.reel.author.avatarColor,
        avatarEmoji: s.reel.author.avatarEmoji,
        image: s.reel.author.image,
      },
      book: s.reel.book ? {
        id: s.reel.book.id,
        title: s.reel.book.title,
        subtitle: s.reel.book.subtitle,
        coverColor: s.reel.book.coverColor,
        coverAccent: s.reel.book.coverAccent,
        coverEmoji: s.reel.book.coverEmoji,
        genre: s.reel.book.genre,
        buyLink: s.reel.book.buyLink,
      } : null,
    })),
  });
}
