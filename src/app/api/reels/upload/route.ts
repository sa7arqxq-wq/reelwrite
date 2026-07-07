/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  validateHook,
  validateCaption,
  validateMood,
  validateBookTitle,
  validateGenre,
  validateUrl,
  validateId,
  sanitizeText,
} from "@/lib/validation";

// POST /api/reels/upload
// body: { hook, caption, mood, duration, background?, bookId?, bookTitle?, bookGenre?, bookLink? }
// The author is determined from the session, NOT from the request body.
// If bookTitle is provided without bookId, a new book is created on the fly.
export async function POST(req: NextRequest) {
  // Get the authenticated user from the session
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to publish" }, { status: 401 });
  }
  if (user.banned) {
    return NextResponse.json({ error: "Account is banned" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    hook,
    caption,
    mood,
    duration,
    background,
    backgroundImage,
    videoUrl,
    bookId,
    bookTitle,
    bookGenre,
    bookLink,
  } = body;

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
        authorId: user.id,
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
      authorId: user.id,
      bookId: resolvedBookId,
      hook: hookV.value,
      hookLines: lines.join("\n"),
      caption: captionV.value,
      mood: moodV.value,
      duration: 7, // Always 7 — brand promise
      background: background === "cover" ? "cover" : background === "image" ? "image" : background === "video" ? "video" : "mood",
      backgroundImage: background === "image" && typeof backgroundImage === "string" && backgroundImage.length < 5_000_000
        ? (backgroundImage.startsWith("data:image/") || backgroundImage.startsWith("https://") ? backgroundImage : null)
        : null,
      videoUrl: background === "video" && typeof videoUrl === "string" && videoUrl.length < 14_000_000
        ? (videoUrl.startsWith("data:video/") || videoUrl.startsWith("https://") ? videoUrl : null)
        : null,
    },
    include: { author: true, book: true },
  });

  await db.user.update({
    where: { id: user.id },
    data: { reelsCount: { increment: 1 } },
  });

  return NextResponse.json({ reel });
}
