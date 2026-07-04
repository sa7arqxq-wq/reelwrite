import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/reels/[id]/share  body: { }  -> increments shares counter
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reel = await db.reel.update({
    where: { id },
    data: { shares: { increment: 1 }, views: { increment: 1 } },
  });
  return NextResponse.json({ shares: reel.shares });
}
