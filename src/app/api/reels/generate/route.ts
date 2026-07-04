/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import { NextRequest, NextResponse } from "next/server";
import { sanitizeText } from "@/lib/validation";

// POST /api/reels/generate
// body: { pitch, genre? }
// Returns: { hooks: string[], mood: string, caption: string }
//
// The pitch is the book's blurb/synopsis. We extract the punchiest lines
// and turn them into 7-second hook candidates. We also pick a mood based on
// the genre and emotional tone of the pitch.

interface HookCandidate {
  text: string;
  score: number;
}

const GENRE_MOODS: Record<string, string> = {
  Romance: "rose",
  "Epic Fantasy": "rose",
  Fantasy: "emerald",
  "Cozy Fantasy": "emerald",
  Mystery: "slate",
  Thriller: "slate",
  Horror: "slate",
  Memoir: "ocean",
  Biography: "ocean",
  Poetry: "ocean",
  "Speculative": "violet",
  "Science Fiction": "violet",
  "Short Stories": "violet",
  "Literary": "amber",
  "Historical": "amber",
  Fiction: "amber",
  "Self-Help": "amber",
  Business: "amber",
  "Young Adult": "rose",
  "Children's": "emerald",
};

// Emotional keywords that map to moods
const EMOTION_KEYWORDS: { words: string[]; mood: string }[] = [
  { words: ["love", "heart", "kiss", "romance", "wedding", "marriage", "lover"], mood: "rose" },
  { words: ["dark", "shadow", "midnight", "night", "gothic", "haunted", "ghost"], mood: "violet" },
  { words: ["sea", "ocean", "water", "tide", "salt", "wave", "river"], mood: "ocean" },
  { words: ["forest", "mushroom", "witch", "cottage", "garden", "tea", "cozy"], mood: "emerald" },
  { words: ["detective", "murder", "case", "file", "clue", "crime", "investigation"], mood: "slate" },
  { words: ["fire", "ember", "empire", "throne", "war", "battle", "flame"], mood: "rose" },
  { words: ["star", "moon", "lighthouse", "light", "cosmos", "galaxy"], mood: "violet" },
  { words: ["mother", "father", "family", "memory", "grief", "loss", "childhood"], mood: "ocean" },
  { words: ["letter", "mail", "post", "tuesday", "morning", "coffee", "midnight"], mood: "amber" },
];

// Sentence-scoring heuristics — what makes a great 7-second hook?
function scoreSentence(sentence: string): number {
  let score = 0;
  const lower = sentence.toLowerCase();
  const wordCount = sentence.split(/\s+/).length;

  // Length: 6-18 words is the sweet spot for a 7-second read
  if (wordCount >= 6 && wordCount <= 18) score += 30;
  else if (wordCount >= 4 && wordCount <= 22) score += 15;
  else if (wordCount > 30) score -= 20;

  // Bonus for emotional trigger words
  const triggers = [
    "but", "and then", "until", "until the", "one day", "when", "she kept",
    "he mailed", "someone wrote", "no longer", "never", "always", "last",
    "first", "only", "every", "forty", "fifty", "hundred",
  ];
  for (const t of triggers) {
    if (lower.includes(t)) score += 10;
  }

  // Bonus for dialogue / first-person hooks
  if (sentence.startsWith('"') || sentence.startsWith("'")) score += 8;
  if (/\b(i |i'm|i've|i'd|my |me |myself)\b/i.test(sentence)) score += 6;

  // Bonus for contrast / reversal words
  if (/\b(but|yet|still|however|although|though)\b/i.test(sentence)) score += 12;

  // Bonus for questions
  if (sentence.endsWith("?")) score += 8;

  // Bonus for em-dashes (often signal a punchy pause)
  if (sentence.includes("—") || sentence.includes("–")) score += 8;

  // Penalty for synopsis-style phrases (boring)
  const boring = [
    "this book", "in this", "a story about", "follows the", "tells the tale",
    "set in", "takes place", "is a novel", "is a memoir", "is a story",
    "the author", "the reader", "will love", "will enjoy", "perfect for",
    "fans of", "for readers",
  ];
  for (const b of boring) {
    if (lower.includes(b)) score -= 25;
  }

  // Penalty for long clauses joined by commas (run-on)
  const commaCount = (sentence.match(/,/g) || []).length;
  if (commaCount >= 3) score -= 8;

  return score;
}

// Extract the best hook candidates from a pitch/blurb
function extractHooks(pitch: string): string[] {
  const clean = sanitizeText(pitch);
  if (!clean) return [];

  // Split into sentences (handle . ! ? and em-dash breaks)
  const sentences = clean
    .split(/(?<=[.!?])\s+|(?<=—)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 200);

  if (sentences.length === 0) return [];

  // Score each sentence
  const scored: HookCandidate[] = sentences.map((text) => ({
    text,
    score: scoreSentence(text),
  }));

  // Sort by score desc
  scored.sort((a, b) => b.score - a.score);

  // Take top 5, filter out near-duplicates, ensure variety
  const result: string[] = [];
  for (const candidate of scored) {
    if (result.length >= 5) break;
    // Skip if too similar to an already-added hook
    const isDup = result.some((existing) => {
      const words1 = new Set(existing.toLowerCase().split(/\s+/));
      const words2 = new Set(candidate.text.toLowerCase().split(/\s+/));
      let common = 0;
      for (const w of words2) if (words1.has(w)) common++;
      return common / Math.min(words1.size, words2.size) > 0.6;
    });
    if (!isDup && candidate.score > -10) {
      result.push(candidate.text);
    }
  }

  // If nothing scored well, just take the first 3 sentences
  if (result.length === 0) {
    return sentences.slice(0, 3);
  }

  return result;
}

// Pick a mood based on genre + emotional content of the pitch
function pickMood(pitch: string, genre?: string): string {
  const lower = pitch.toLowerCase();

  // First check emotional keywords (strongest signal)
  const moodCounts: Record<string, number> = {};
  for (const { words, mood } of EMOTION_KEYWORDS) {
    for (const word of words) {
      if (lower.includes(word)) {
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      }
    }
  }

  const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  if (sortedMoods.length > 0 && sortedMoods[0][1] >= 1) {
    return sortedMoods[0][0];
  }

  // Fall back to genre mapping
  if (genre && GENRE_MOODS[genre]) {
    return GENRE_MOODS[genre];
  }

  // Default
  return "amber";
}

// Generate a short caption from the pitch
function generateCaption(genre?: string): string {
  const captions: Record<string, string> = {
    Romance: "A love story you won't forget. 💌",
    "Epic Fantasy": "An epic begins. 🔥",
    Fantasy: "Magic awaits. ✨",
    "Cozy Fantasy": "Cozy up and stay a while. 🍄",
    Mystery: "Every clue leads deeper. 🔎",
    Thriller: "Buckle up. 🌑",
    Horror: "Read with the lights on. 🕯️",
    Memoir: "A story only she could tell. 🌊",
    Biography: "A life worth knowing. 🌊",
    Poetry: "Poems for the quiet hours. 🌊",
    Speculative: "What if everything changed? 🔮",
    "Science Fiction": "The future is closer than you think. 🔮",
    "Short Stories": "Twelve small worlds. ⛈️",
    Historical: "The past feels present. 🕯️",
    Fiction: "A story that stays with you. 📖",
  };
  if (genre && captions[genre]) return captions[genre];
  return "Read the first chapter free. 📖";
}

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

  const hooks = extractHooks(pitch);
  if (hooks.length === 0) {
    return NextResponse.json(
      { error: "Couldn't extract a hook from that pitch. Try a different blurb." },
      { status: 422 }
    );
  }

  const mood = pickMood(pitch, genre);
  const caption = generateCaption(genre);

  return NextResponse.json({
    hooks,
    mood,
    caption,
  });
}
