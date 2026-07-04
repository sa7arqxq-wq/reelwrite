import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/reels/upload
// body: { authorId, bookId?, hook, caption, mood, duration, bookTitle?, bookGenre?, bookLink? }
// For demo: no real video upload — reels are kinetic-typography only.
// If bookTitle is provided without bookId, a new book is created on the fly.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    authorId,
    bookId,
    hook,
    caption,
    mood,
    duration,
    bookTitle,
    bookGenre,
    bookLink,
  } = body;

  if (!authorId || !hook?.trim()) {
    return NextResponse.json({ error: "authorId and hook required" }, { status: 400 });
  }

  // Break hook into lines for kinetic reveal
  const pieces = hook.trim().split(/(?<=[.,—!?])\s+/);
  const lines: string[] = [];
  for (const p of pieces) {
    if (lines.length === 0) lines.push(p);
    else {
      const last = lines[lines.length - 1];
      if (last.length < 22) lines[lines.length - 1] = last + " " + p;
      else lines.push(p);
    }
  }

  // Create a book on the fly if a title is provided but no bookId
  let resolvedBookId = bookId || null;
  if (!resolvedBookId && bookTitle?.trim()) {
    const palette = [
      { color: "#1e1b4b", accent: "#fbbf24", emoji: "📖" },
      { color: "#7f1d1d", accent: "#fecaca", emoji: "📕" },
      { color: "#14532d", accent: "#fde68a", emoji: "📗" },
      { color: "#581c87", accent: "#fcd34d", emoji: "📘" },
      { color: "#0c4a6e", accent: "#7dd3fc", emoji: "📙" },
      { color: "#1c1917", accent: "#f59e0b", emoji: "📓" },
    ];
    const pick = palette[Math.floor(Math.random() * palette.length)];
    const book = await db.book.create({
      data: {
        authorId,
        title: bookTitle.trim(),
        subtitle: bookGenre || "A Book",
        coverColor: pick.color,
        coverAccent: pick.accent,
        coverEmoji: pick.emoji,
        description: "",
        genre: bookGenre || "Fiction",
        buyLink: bookLink || "",
        pages: 0,
      },
    });
    resolvedBookId = book.id;
  }

  const reel = await db.reel.create({
    data: {
      authorId,
      bookId: resolvedBookId,
      hook: hook.trim(),
      hookLines: lines.join("\n"),
      caption: caption?.trim() || "",
      mood: mood || "amber",
      duration: duration || 7,
    },
    include: { author: true, book: true },
  });

  await db.user.update({
    where: { id: authorId },
    data: { reelsCount: { increment: 1 } },
  });

  return NextResponse.json({ reel });
}
