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
import { validateId } from "@/lib/validation";

// POST /api/reels/[id]/like  body: { userId }  -> toggles like
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reelIdV = validateId(id);
  if (!reelIdV.ok) {
    return NextResponse.json({ error: reelIdV.error }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const userIdV = validateId(body.userId);
  if (!userIdV.ok) {
    return NextResponse.json({ error: userIdV.error }, { status: 400 });
  }

  // Verify both reel and user exist
  const [reel, user] = await Promise.all([
    db.reel.findUnique({ where: { id: reelIdV.value } }),
    db.user.findUnique({ where: { id: userIdV.value } }),
  ]);
  if (!reel) return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.banned) return NextResponse.json({ error: "Account is banned" }, { status: 403 });

  const existing = await db.like.findUnique({
    where: { reelId_userId: { reelId: reelIdV.value, userId: userIdV.value } },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    const updated = await db.reel.update({
      where: { id: reelIdV.value },
      data: { likes: { decrement: 1 } },
    });
    return NextResponse.json({ liked: false, likes: Math.max(0, updated.likes) });
  } else {
    await db.like.create({ data: { reelId: reelIdV.value, userId: userIdV.value } });
    const updated = await db.reel.update({
      where: { id: reelIdV.value },
      data: { likes: { increment: 1 } },
    });
    return NextResponse.json({ liked: true, likes: updated.likes });
  }
}
