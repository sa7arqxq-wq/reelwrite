/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import { NextRequest, NextResponse } from "next/server";
import { sanitizeText } from "@/lib/validation";
import { extractHooks, pickMood, generateCaption } from "./_lib";

// POST /api/reels/generate
// body: { pitch, genre? }
// Returns: { hooks: string[], mood: string, caption: string, source: "extractive" }
//
// Extractive mode — pulls the punchiest sentences from the pitch as-is.
// For AI-rewritten hooks, use /api/reels/generate-ai instead.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { pitch, genre } = body;

  if (typeof pitch !== "string" || pitch.trim().length < 10) {
    return NextResponse.json(
      { error: "Pitch must be at least 10 characters" },
      { status: 400 }
    );
  }
  if (pitch.length > 5000) {
    return NextResponse.json(
      { error: "Pitch must be 5000 characters or fewer" },
      { status: 400 }
    );
  }

  const cleanPitch = sanitizeText(pitch);
  const hooks = extractHooks(cleanPitch);
  if (hooks.length === 0) {
    return NextResponse.json(
      { error: "Couldn't extract a hook from that pitch. Try a different blurb." },
      { status: 422 }
    );
  }

  const mood = pickMood(cleanPitch, genre);
  const caption = generateCaption(genre);

  return NextResponse.json({
    hooks,
    mood,
    caption,
    source: "extractive" as const,
  });
}
