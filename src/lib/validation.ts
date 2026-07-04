/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the proprietary work of ReelWrite. No part of this
 * software may be copied, reproduced, distributed, or used to create
 * derivative works without the express written permission of ReelWrite.
 * Unauthorized use, duplication, or distribution is prohibited.
 *
 * For licensing inquiries: legal@reelwrite.app
 */

/**
 * Input validation + sanitization helpers.
 * All write endpoints should run their inputs through these before touching the DB.
 */

const MAX_HOOK_LENGTH = 280;
const MAX_CAPTION_LENGTH = 280;
const MAX_COMMENT_LENGTH = 500;
const MAX_USERNAME_LENGTH = 30;
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 200;
const MAX_BOOK_TITLE_LENGTH = 200;
const MAX_URL_LENGTH = 2048;

/** Strip HTML tags and trim whitespace. Also collapses zero-width chars used to hide content. */
export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .replace(/[<>]/g, "") // angle brackets
    .trim();
}

/** Validate and sanitize a reel hook */
export function validateHook(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const v = sanitizeText(input);
  if (!v) return { ok: false, error: "Hook is required" };
  if (v.length > MAX_HOOK_LENGTH) return { ok: false, error: `Hook must be ${MAX_HOOK_LENGTH} characters or fewer` };
  return { ok: true, value: v };
}

/** Validate and sanitize a caption */
export function validateCaption(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const v = sanitizeText(input);
  if (v.length > MAX_CAPTION_LENGTH) return { ok: false, error: `Caption must be ${MAX_CAPTION_LENGTH} characters or fewer` };
  return { ok: true, value: v };
}

/** Validate and sanitize a comment */
export function validateComment(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const v = sanitizeText(input);
  if (!v) return { ok: false, error: "Comment text is required" };
  if (v.length > MAX_COMMENT_LENGTH) return { ok: false, error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` };
  return { ok: true, value: v };
}

/** Validate a cuid (Prisma's default ID format) */
export function validateId(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof input !== "string") return { ok: false, error: "Invalid ID" };
  if (!/^[a-z0-9]{20,30}$/i.test(input)) return { ok: false, error: "Invalid ID format" };
  return { ok: true, value: input };
}

/** Validate a URL — must be http(s) and reasonably short */
export function validateUrl(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof input !== "string" || !input) return { ok: false, error: "URL is required" };
  if (input.length > MAX_URL_LENGTH) return { ok: false, error: "URL is too long" };
  try {
    const u = new URL(input);
    if (!["http:", "https:"].includes(u.protocol)) {
      return { ok: false, error: "URL must be http or https" };
    }
    return { ok: true, value: input };
  } catch {
    return { ok: false, error: "Invalid URL" };
  }
}

/** Validate a mood key against the allowlist */
const VALID_MOODS = ["amber", "rose", "emerald", "violet", "slate", "ocean"];
export function validateMood(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof input !== "string" || !VALID_MOODS.includes(input)) {
    return { ok: false, error: "Invalid mood" };
  }
  return { ok: true, value: input };
}

/** Validate a username — alphanumeric + dots/dashes/underscores, 3-30 chars */
export function validateUsername(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof input !== "string") return { ok: false, error: "Username is required" };
  if (!/^[a-z0-9._-]{3,30}$/i.test(input)) {
    return { ok: false, error: "Username must be 3-30 chars: letters, numbers, . _ -" };
  }
  return { ok: true, value: input };
}

/** Validate a display name */
export function validateDisplayName(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const v = sanitizeText(input);
  if (!v) return { ok: false, error: "Display name is required" };
  if (v.length > MAX_DISPLAY_NAME_LENGTH) return { ok: false, error: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} chars or fewer` };
  return { ok: true, value: v };
}

/** Validate a bio */
export function validateBio(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const v = sanitizeText(input);
  if (v.length > MAX_BIO_LENGTH) return { ok: false, error: `Bio must be ${MAX_BIO_LENGTH} chars or fewer` };
  return { ok: true, value: v };
}

/** Validate a book title */
export function validateBookTitle(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const v = sanitizeText(input);
  if (!v) return { ok: false, error: "Book title is required" };
  if (v.length > MAX_BOOK_TITLE_LENGTH) return { ok: false, error: `Book title must be ${MAX_BOOK_TITLE_LENGTH} chars or fewer` };
  return { ok: true, value: v };
}

/** Validate a genre */
const VALID_GENRES = [
  "Fiction", "Non-Fiction", "Romance", "Mystery", "Fantasy", "Epic Fantasy",
  "Science Fiction", "Speculative", "Horror", "Thriller", "Memoir", "Biography",
  "Poetry", "Short Stories", "Young Adult", "Children's", "Historical",
  "Literary", "Cozy Fantasy", "Self-Help", "Business", "Other",
];
export function validateGenre(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const v = sanitizeText(input);
  if (!v) return { ok: false, error: "Genre is required" };
  if (v.length > 50) return { ok: false, error: "Genre is too long" };
  // Allow free-form genre but cap length; the allowlist is just a guide
  return { ok: true, value: v };
}

export const LIMITS = {
  MAX_HOOK_LENGTH,
  MAX_CAPTION_LENGTH,
  MAX_COMMENT_LENGTH,
  MAX_USERNAME_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_BIO_LENGTH,
  MAX_BOOK_TITLE_LENGTH,
};

// Suppress unused warning for VALID_GENRES — kept for future use
export const _GENRES = VALID_GENRES;
