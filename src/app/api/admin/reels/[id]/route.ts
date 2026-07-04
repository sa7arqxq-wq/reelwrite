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

async function requireAdmin(req: NextRequest) {
  const userId =
    req.nextUrl.searchParams.get("userId") ||
    (req.headers.get("x-user-id") as string | null);
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// PATCH /api/admin/reels/[id]  body: { userId, action: "feature" | "unfeature" }
// DELETE /api/admin/reels/[id]?userId=...  — hard delete the reel

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (body.action === "feature") {
    const reel = await db.reel.update({
      where: { id },
      data: { featured: true },
    });
    return NextResponse.json({ reel });
  }
  if (body.action === "unfeature") {
    const reel = await db.reel.update({
      where: { id },
      data: { featured: false },
    });
    return NextResponse.json({ reel });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Cascade: delete likes + comments first (Prisma onDelete: Cascade handles this,
  // but SQLite sometimes needs explicit cleanup for safety)
  await db.like.deleteMany({ where: { reelId: id } });
  await db.comment.deleteMany({ where: { reelId: id } });
  const reel = await db.reel.delete({ where: { id } });

  // Decrement author's reelsCount
  if (reel.authorId) {
    await db.user.update({
      where: { id: reel.authorId },
      data: { reelsCount: { decrement: 1 } },
    });
  }

  return NextResponse.json({ ok: true, id });
}
