import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/me — get-or-create the demo "current user" (a writer named You)
export async function GET() {
  let me = await db.user.findUnique({ where: { username: "you.writer" } });
  if (!me) {
    me = await db.user.create({
      data: {
        username: "you.writer",
        displayName: "You",
        bio: "Demo writer. Edit your bio in the profile tab.",
        avatarColor: "#f59e0b",
        avatarEmoji: "✨",
        isWriter: true,
      },
    });
  }
  return NextResponse.json({ me });
}
