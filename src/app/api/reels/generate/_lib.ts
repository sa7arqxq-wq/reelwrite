/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * Shared library for hook extraction, mood picking, and caption generation.
 * Used by both /api/reels/generate (extractive) and /api/reels/generate-ai (AI rewrite).
 */

import { sanitizeText } from "@/lib/validation";

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
  Speculative: "violet",
  "Science Fiction": "violet",
  "Short Stories": "violet",
  Literary: "amber",
  Historical: "amber",
  Fiction: "amber",
  "Self-Help": "amber",
  Business: "amber",
  "Young Adult": "rose",
  "Children's": "emerald",
};

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

interface HookCandidate {
  text: string;
  score: number;
}

function scoreSentence(sentence: string): number {
  let score = 0;
  const lower = sentence.toLowerCase();
  const wordCount = sentence.split(/\s+/).length;

  if (wordCount >= 6 && wordCount <= 18) score += 30;
  else if (wordCount >= 4 && wordCount <= 22) score += 15;
  else if (wordCount > 30) score -= 20;

  const triggers = [
    "but", "and then", "until", "until the", "one day", "when", "she kept",
    "he mailed", "someone wrote", "no longer", "never", "always", "last",
    "first", "only", "every", "forty", "fifty", "hundred",
  ];
  for (const t of triggers) {
    if (lower.includes(t)) score += 10;
  }

  if (sentence.startsWith('"') || sentence.startsWith("'")) score += 8;
  if (/\b(i |i'm|i've|i'd|my |me |myself)\b/i.test(sentence)) score += 6;
  if (/\b(but|yet|still|however|although|though)\b/i.test(sentence)) score += 12;
  if (sentence.endsWith("?")) score += 8;
  if (sentence.includes("—") || sentence.includes("–")) score += 8;

  const boring = [
    "this book", "in this", "a story about", "follows the", "tells the tale",
    "set in", "takes place", "is a novel", "is a memoir", "is a story",
    "the author", "the reader", "will love", "will enjoy", "perfect for",
    "fans of", "for readers",
  ];
  for (const b of boring) {
    if (lower.includes(b)) score -= 25;
  }

  const commaCount = (sentence.match(/,/g) || []).length;
  if (commaCount >= 3) score -= 8;

  return score;
}

export function extractHooks(pitch: string): string[] {
  const clean = sanitizeText(pitch);
  if (!clean) return [];

  const sentences = clean
    .split(/(?<=[.!?])\s+|(?<=—)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 200);

  if (sentences.length === 0) return [];

  const scored: HookCandidate[] = sentences.map((text) => ({
    text,
    score: scoreSentence(text),
  }));

  scored.sort((a, b) => b.score - a.score);

  const result: string[] = [];
  for (const candidate of scored) {
    if (result.length >= 5) break;
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

  if (result.length === 0) {
    return sentences.slice(0, 3);
  }

  return result;
}

/**
 * Creative rewrite — transforms extracted sentences into new hook variations.
 * This runs locally (no AI API needed) and produces genuinely different hooks
 * by restructuring, compressing, and combining ideas from the pitch.
 */
export function rewriteHooks(pitch: string): string[] {
  const clean = sanitizeText(pitch);
  if (!clean) return [];

  const sentences = clean
    .split(/(?<=[.!?])\s+|(?<=—)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 300);

  if (sentences.length === 0) return [];

  // Start with the best extracted hooks
  const extracted = extractHooks(clean);
  const result: string[] = [...extracted];

  // Add creative transformations
  const transforms: string[] = [];

  // 1. Staccato: take the punchiest sentence and break it into fragments
  if (extracted.length > 0) {
    const best = extracted[0];
    const words = best.split(/\s+/);
    if (words.length > 6) {
      // Find a natural break point (after "but", "and", comma)
      const breakIdx = words.findIndex((w, i) => i > 2 && /^(but|and|until|when|then)$/i.test(w));
      if (breakIdx > 2 && breakIdx < words.length - 2) {
        const part1 = words.slice(0, breakIdx).join(" ").replace(/[,.]$/, "");
        const part2 = words.slice(breakIdx).join(" ");
        transforms.push(`${part1}. ${part2}.`);
      }
    }
  }

  // 2. Question: turn a statement into a question
  if (sentences.length > 0) {
    const s = sentences[0];
    if (s.includes(" must ") || s.includes(" had to ") || s.includes(" needed to ")) {
      const q = s.replace(/^(She|He|They|It|The|When|After)\s+/i, "What happens when ");
      transforms.push(q.replace(/[.!]$/, "?"));
    }
  }

  // 3. Reversal: swap the order of clauses
  if (extracted.length > 1) {
    const parts = extracted[0].split(/,\s+/);
    if (parts.length === 2) {
      transforms.push(`${parts[1].trim()}. ${parts[0].trim()}.`);
    }
  }

  // 4. Compression: take the longest sentence and shorten it
  if (sentences.length > 1) {
    const longest = sentences.reduce((a, b) => a.length > b.length ? a : b);
    const words = longest.split(/\s+/);
    if (words.length > 10) {
      // Take first 8 words
      transforms.push(words.slice(0, 8).join(" ") + "...");
    }
  }

  // 5. Combine: merge two short sentences into one
  if (sentences.length >= 2) {
    const s1 = sentences[0].replace(/[.!]$/, "");
    const s2 = sentences[1].replace(/[.!]$/, "");
    if (s1.length < 80 && s2.length < 80) {
      transforms.push(`${s1}. ${s2}.`);
    }
  }

  // Add unique transforms to results
  for (const t of transforms) {
    if (result.length >= 5) break;
    if (t.length < 6 || t.length > 200) continue;
    const isDup = result.some((existing) => {
      const words1 = new Set(existing.toLowerCase().split(/\s+/));
      const words2 = new Set(t.toLowerCase().split(/\s+/));
      let common = 0;
      for (const w of words2) if (words1.has(w)) common++;
      return common / Math.min(words1.size, words2.size) > 0.7;
    });
    if (!isDup) {
      result.push(t);
    }
  }

  // Ensure we have at least 3 hooks
  while (result.length < 3 && sentences.length > result.length) {
    const next = sentences[result.length];
    if (next && next.length > 10 && next.length < 200) {
      result.push(next);
    } else {
      break;
    }
  }

  return result.slice(0, 5);
}

export function pickMood(pitch: string, genre?: string): string {
  const lower = pitch.toLowerCase();

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

  if (genre && GENRE_MOODS[genre]) {
    return GENRE_MOODS[genre];
  }

  return "amber";
}

export function generateCaption(genre?: string): string {
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
