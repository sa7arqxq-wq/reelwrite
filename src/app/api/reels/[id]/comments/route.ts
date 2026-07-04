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
import { validateId, validateComment } from "@/lib/validation";

// GET /api/reels/[id]/comments
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idV = validateId(id);
  if (!idV.ok) {
    return NextResponse.json({ error: idV.error }, { status: 400 });
  }
  const comments = await db.comment.findMany({
    where: { reelId: idV.value },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  return NextResponse.json({ comments });
}

// POST /api/reels/[id]/comments  body: { userId, text }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reelIdV = validateId(id);
  if (!reelIdV.ok) {
    return NextResponse.json({ error: reelIdV.error }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { userId, text } = body;

  const userIdV = validateId(userId);
  if (!userIdV.ok) {
    return NextResponse.json({ error: userIdV.error }, { status: 400 });
  }

  const textV = validateComment(text);
  if (!textV.ok) {
    return NextResponse.json({ error: textV.error }, { status: 400 });
  }

  // Verify the reel exists
  const reel = await db.reel.findUnique({ where: { id: reelIdV.value } });
  if (!reel) {
    return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  }

  // Verify the user exists and isn't banned
  const user = await db.user.findUnique({ where: { id: userIdV.value } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.banned) {
    return NextResponse.json({ error: "Account is banned" }, { status: 403 });
  }

  const comment = await db.comment.create({
    data: { reelId: reelIdV.value, userId: userIdV.value, text: textV.value },
    include: { user: true },
  });
  await db.reel.update({
    where: { id: reelIdV.value },
    data: { comments: { increment: 1 } },
  });
  return NextResponse.json({ comment });
}
