import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/admin/stats?userId=...  — site-wide stats for the admin dashboard
// Requires the caller to be an admin.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const caller = await db.user.findUnique({ where: { id: userId } });
  if (!caller || caller.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [
    totalUsers,
    totalWriters,
    totalAdmins,
    totalReels,
    totalBooks,
    totalLikes,
    totalComments,
    totalViews,
    totalShares,
    totalSaves,
    bannedUsers,
    featuredReels,
    reelsToday,
    usersToday,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isWriter: true } }),
    db.user.count({ where: { role: "ADMIN" } }),
    db.reel.count(),
    db.book.count(),
    db.like.count(),
    db.comment.count(),
    db.reel.aggregate({ _sum: { views: true } }),
    db.reel.aggregate({ _sum: { shares: true } }),
    db.reel.aggregate({ _sum: { saves: true } }),
    db.user.count({ where: { banned: true } }),
    db.reel.count({ where: { featured: true } }),
    db.reel.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    db.user.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  // Top reels by views (last 7 days)
  const topReels = await db.reel.findMany({
    orderBy: { views: "desc" },
    take: 5,
    include: { author: true, book: true },
  });

  // Recent reels (for moderation queue)
  const recentReels = await db.reel.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { author: true, book: true },
  });

  // Recent comments (for moderation queue)
  const recentComments = await db.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: true, reel: { include: { author: true } } },
  });

  return NextResponse.json({
    stats: {
      totalUsers,
      totalWriters,
      totalAdmins,
      totalReels,
      totalBooks,
      totalLikes,
      totalComments,
      totalViews: totalViews._sum.views || 0,
      totalShares: totalShares._sum.shares || 0,
      totalSaves: totalSaves._sum.saves || 0,
      bannedUsers,
      featuredReels,
      reelsToday,
      usersToday,
    },
    topReels,
    recentReels,
    recentComments,
  });
}
