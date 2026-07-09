import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// POST /api/stories/[id]/view — mark a story as viewed by current user
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const story = await db.story.findUnique({ where: { id } });
  if (!story) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const viewedBy = JSON.parse(story.viewedBy || "[]") as string[];
  if (!viewedBy.includes(user.id)) {
    viewedBy.push(user.id);
    await db.story.update({
      where: { id },
      data: { viewedBy: JSON.stringify(viewedBy) },
    });
  }

  return NextResponse.json({ ok: true, viewCount: viewedBy.length });
}
