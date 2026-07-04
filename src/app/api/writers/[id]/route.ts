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

// GET /api/writers/[id]  — profile + their reels + books
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const writer = await db.user.findUnique({
    where: { id },
    include: {
      reels: { orderBy: { createdAt: "desc" }, include: { book: true } },
      books: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!writer) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ writer });
}
