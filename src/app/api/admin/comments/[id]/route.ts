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

// DELETE /api/admin/comments/[id]?userId=...  — hard delete a comment
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const comment = await db.comment.delete({ where: { id } });

  // Decrement the reel's comment count
  if (comment.reelId) {
    await db.reel.update({
      where: { id: comment.reelId },
      data: { comments: { decrement: 1 } },
    });
  }

  return NextResponse.json({ ok: true, id });
}
