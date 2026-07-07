import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { validateHook, validateCaption, validateMood } from "@/lib/validation";

// PATCH /api/reels/[id]/edit — edit a reel's hook, caption, or mood
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const reel = await db.reel.findUnique({ where: { id } });
  if (!reel) return NextResponse.json({ error: "Reel not found" }, { status: 404 });
  if (reel.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};

  if (body.hook !== undefined) {
    const v = validateHook(body.hook);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    updates.hook = v.value;
    // Re-break into lines
    const pieces = v.value.split(/(?<=[.,—!?])\s+/);
    const lines: string[] = [];
    for (const p of pieces) {
      if (lines.length === 0) lines.push(p);
      else {
        const last = lines[lines.length - 1];
        if (last.length < 22) lines[lines.length - 1] = last + " " + p;
        else lines.push(p);
      }
    }
    updates.hookLines = lines.join("\n");
  }
  if (body.caption !== undefined) {
    const v = validateCaption(body.caption);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    updates.caption = v.value;
  }
  if (body.mood !== undefined) {
    const v = validateMood(body.mood);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    updates.mood = v.value;
  }

  const updated = await db.reel.update({ where: { id }, data: updates, include: { author: true, book: true } });
  return NextResponse.json({ reel: updated });
}
