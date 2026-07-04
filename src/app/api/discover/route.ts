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

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/discover — trending writers + genre buckets
export async function GET() {
  const writers = await db.user.findMany({
    where: { isWriter: true },
    orderBy: { followers: "desc" },
    take: 12,
  });

  const reels = await db.reel.findMany({
    orderBy: { views: "desc" },
    take: 6,
    include: { author: true, book: true },
  });

  // Group reels by book genre for buckets
  const genreMap = new Map<string, typeof reels>();
  for (const r of reels) {
    const g = r.book?.genre || "Other";
    if (!genreMap.has(g)) genreMap.set(g, []);
    genreMap.get(g)!.push(r);
  }

  return NextResponse.json({
    writers,
    trendingReels: reels,
    genres: Array.from(genreMap.entries()).map(([genre, items]) => ({ genre, items })),
  });
}
