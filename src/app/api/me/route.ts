import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/me — get-or-create the demo "current user" (an admin writer named You)
export async function GET() {
  let me = await db.user.findUnique({ where: { username: "you.writer" } });
  if (!me) {
    me = await db.user.create({
      data: {
        username: "you.writer",
        displayName: "You",
        bio: "Admin. Marketing my books in 7-second reels.",
        avatarColor: "#f59e0b",
        avatarEmoji: "✨",
        isWriter: true,
        role: "ADMIN",
      },
    });
  } else if (me.role !== "ADMIN") {
    // Ensure the demo account is always an admin
    me = await db.user.update({
      where: { id: me.id },
      data: { role: "ADMIN" },
    });
  }
  return NextResponse.json({ me });
}
