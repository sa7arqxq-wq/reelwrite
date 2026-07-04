/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  validateId,
  validateHook,
  validateCaption,
  validateMood,
  validateBookTitle,
  validateGenre,
  validateUrl,
  sanitizeText,
} from "@/lib/validation";

// POST /api/reels/upload
// body: { authorId, bookId?, hook, caption, mood, duration, background?, bookTitle?, bookGenre?, bookLink? }
// For demo: no real video upload — reels are kinetic-typography only.
// If bookTitle is provided without bookId, a new book is created on the fly.
// background: "mood" (default, uses mood gradient) | "cover" (uses book cover as background)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    authorId,
    bookId,
    hook,
    caption,
    mood,
    duration,
    background,
    bookTitle,
    bookGenre,
    bookLink,
  } = body;

  // Validate authorId
  const authorIdV = validateId(authorId);
  if (!authorIdV.ok) {
    return NextResponse.json({ error: authorIdV.error }, { status: 400 });
  }
  // Confirm the author exists
  const author = await db.user.findUnique({ where: { id: authorIdV.value } });
  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }
  if (author.banned) {
    return NextResponse.json({ error: "Account is banned" }, { status: 403 });
  }

  // Validate hook
  const hookV = validateHook(hook);
  if (!hookV.ok) {
    return NextResponse.json({ error: hookV.error }, { status: 400 });
  }

  // Validate caption (optional)
  const captionV = validateCaption(caption);
  if (!captionV.ok) {
    return NextResponse.json({ error: captionV.error }, { status: 400 });
  }

  // Validate mood
  const moodV = validateMood(mood);
  if (!moodV.ok) {
    return NextResponse.json({ error: moodV.error }, { status: 400 });
  }

  // Validate optional bookId
  let resolvedBookId: string | null = null;
  if (bookId) {
    const bookIdV = validateId(bookId);
    if (!bookIdV.ok) {
      return NextResponse.json({ error: bookIdV.error }, { status: 400 });
    }
    resolvedBookId = bookIdV.value;
  }

  // Validate optional book fields
  let validatedBookTitle: string | null = null;
  let validatedBookGenre = "Fiction";
  let validatedBookLink = "";
  if (bookTitle) {
    const btV = validateBookTitle(bookTitle);
    if (!btV.ok) return NextResponse.json({ error: btV.error }, { status: 400 });
    validatedBookTitle = btV.value;
  }
  if (bookGenre) {
    const bgV = validateGenre(bookGenre);
    if (!bgV.ok) return NextResponse.json({ error: bgV.error }, { status: 400 });
    validatedBookGenre = bgV.value;
  }
  if (bookLink) {
    const blV = validateUrl(bookLink);
    if (!blV.ok) return NextResponse.json({ error: blV.error }, { status: 400 });
    validatedBookLink = blV.value;
  }

  // Break hook into lines for kinetic reveal
  const pieces = hookV.value.split(/(?<=[.,—!?])\s+/);
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
  if (!resolvedBookId && validatedBookTitle) {
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
        authorId: authorIdV.value,
        title: validatedBookTitle,
        subtitle: sanitizeText(validatedBookGenre) || "A Book",
        coverColor: pick.color,
        coverAccent: pick.accent,
        coverEmoji: pick.emoji,
        description: "",
        genre: validatedBookGenre,
        buyLink: validatedBookLink,
        pages: 0,
      },
    });
    resolvedBookId = book.id;
  }

  const reel = await db.reel.create({
    data: {
      authorId: authorIdV.value,
      bookId: resolvedBookId,
      hook: hookV.value,
      hookLines: lines.join("\n"),
      caption: captionV.value,
      mood: moodV.value,
      duration: duration === 7 ? 7 : 7, // Always 7 — brand promise
      background: background === "cover" ? "cover" : "mood",
    },
    include: { author: true, book: true },
  });

  await db.user.update({
    where: { id: authorIdV.value },
    data: { reelsCount: { increment: 1 } },
  });

  return NextResponse.json({ reel });
}
