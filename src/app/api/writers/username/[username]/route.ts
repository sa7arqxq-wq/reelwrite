import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/writers/username/[username] — fetch a writer by username
export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const writer = await db.user.findUnique({
    where: { username },
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
