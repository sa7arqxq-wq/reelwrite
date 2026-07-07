/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the proprietary work of ReelWrite. No part of this
 * software may be copied, reproduced, distributed, or used to create
 * derivative works without the express written permission of ReelWrite.
 * Unauthorized use, duplication, or distribution is prohibited.
 *
 * For licensing inquiries: legal@reelwrite.app
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reels?feed=for-you|following|trending
// For "for-you" feed, featured reels are sorted to the top.
export async function GET(req: NextRequest) {
  const feed = req.nextUrl.searchParams.get("feed") || "for-you";
  const currentUserId = req.nextUrl.searchParams.get("userId");

  let reels;
  if (feed === "trending") {
    reels = await db.reel.findMany({
      orderBy: { views: "desc" },
      take: 20,
      include: { author: true, book: true },
    });
  } else if (feed === "following" && currentUserId) {
    const following = await db.follow.findMany({
      where: { followerId: currentUserId },
      select: { followeeId: true },
    });
    const ids = following.map((f) => f.followeeId);
    reels = await db.reel.findMany({
      where: { authorId: { in: ids } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { author: true, book: true },
    });
  } else {
    // For You: featured first, then by recency
    reels = await db.reel.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 20,
      include: { author: true, book: true },
    });
  }

  // Mark which ones the current user has liked
  let likedIds = new Set<string>();
  if (currentUserId) {
    const likes = await db.like.findMany({
      where: { userId: currentUserId, reelId: { in: reels.map((r) => r.id) } },
      select: { reelId: true },
    });
    likedIds = new Set(likes.map((l) => l.reelId));
  }

  return NextResponse.json({
    reels: reels.map((r) => ({
      ...r,
      liked: likedIds.has(r.id),
    })),
  });
}
