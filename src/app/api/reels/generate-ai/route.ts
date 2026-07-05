/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import { NextRequest, NextResponse } from "next/server";
import { sanitizeText } from "@/lib/validation";
import { extractHooks, pickMood, generateCaption } from "../generate/_lib";

// POST /api/reels/generate-ai
// body: { pitch, genre? }
// Returns: { hooks: string[], mood: string, caption: string, source: "ai" | "extractive" }
//
// Uses the z-ai SDK to REWRITE the pitch into compelling 7-second hooks.
// Falls back to extractive mode if the AI call fails.

const SYSTEM_PROMPT = `You are a master book marketer who writes 7-second reel hooks for TikTok/Reels.

Your job: take a book's pitch/blurb and rewrite it into 3-5 punchy hook lines that would make someone stop scrolling and want to read the book.

RULES FOR GREAT HOOKS:
- Each hook must be 6-18 words (readable in 7 seconds)
- Start with a concrete image, not a synopsis ("She kept the light on..." not "This book is about...")
- Use contrast, mystery, or reversal ("He mailed a letter to an address that no longer existed. Someone wrote back.")
- End on a cliffhanger or an unsettling image when possible
- Never use synopsis phrases like "this book", "follows the story", "set in", "a novel about"
- Never use marketing speak like "perfect for fans of", "will love", "must read"
- Each hook should be a complete thought that stands alone
- Vary the structure across hooks — don't just rearrange the same words

OUTPUT FORMAT:
Return ONLY the hooks, one per line, numbered 1-5. No commentary, no explanations.

Example input: "When the stars go dark, one lighthouse keeper must light the way home. She kept the light on for forty years. But on the forty-first year, the dark started keeping her company."

Example output:
1. She kept the light on for forty years — and on the forty-first, the dark kept her company.
2. The stars went dark. She kept burning. Someone had to.
3. Forty years of light. One year of dark. Which one kept her?
4. The lighthouse was never for the ships. It was for the dark itself.
5. What happens when the only light left is the one you're keeping?`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { pitch, genre } = body;

  if (typeof pitch !== "string" || pitch.trim().length < 10) {
    return NextResponse.json(
      { error: "Pitch must be at least 10 characters" },
      { status: 400 }
    );
  }
  if (pitch.length > 2000) {
    return NextResponse.json(
      { error: "Pitch must be 2000 characters or fewer" },
      { status: 400 }
    );
  }

  const cleanPitch = sanitizeText(pitch);
  const mood = pickMood(cleanPitch, genre);
  const caption = generateCaption(genre);

  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PROMPT },
        { role: "user", content: `Book pitch:\n\n${cleanPitch}\n\nGenre: ${genre || "Fiction"}\n\nWrite 5 hook lines:` },
      ],
      thinking: { type: "disabled" },
    });

    const rawResponse = completion.choices[0]?.message?.content || "";

    const aiHooks = rawResponse
      .split("\n")
      .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((line: string) => line.length > 0 && line.length <= 200)
      .filter((line: string) => !line.toLowerCase().startsWith("here are") && !line.toLowerCase().startsWith("sure"))
      .slice(0, 5);

    if (aiHooks.length >= 2) {
      return NextResponse.json({
        hooks: aiHooks,
        mood,
        caption,
        source: "ai" as const,
      });
    }

    const extractiveHooks = extractHooks(cleanPitch);
    return NextResponse.json({
      hooks: extractiveHooks,
      mood,
      caption,
      source: "extractive" as const,
    });
  } catch (error) {
    console.error("[generate-ai] AI call failed, falling back to extractive:", error);
    const extractiveHooks = extractHooks(cleanPitch);
    if (extractiveHooks.length === 0) {
      return NextResponse.json(
        { error: "Couldn't generate hooks from that pitch. Try a different blurb." },
        { status: 422 }
      );
    }
    return NextResponse.json({
      hooks: extractiveHooks,
      mood,
      caption,
      source: "extractive" as const,
    });
  }
}
