/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  validateUsername,
  validateDisplayName,
  sanitizeText,
} from "@/lib/validation";

// POST /api/auth/signup
// body: { email, password, username, displayName }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, password, username, displayName } = body;

  // Validate email
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  // Validate password
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (password.length > 200) {
    return NextResponse.json({ error: "Password is too long" }, { status: 400 });
  }

  // Validate username
  const usernameV = validateUsername(username);
  if (!usernameV.ok) {
    return NextResponse.json({ error: usernameV.error }, { status: 400 });
  }
  // Validate display name
  const displayNameV = validateDisplayName(displayName);
  if (!displayNameV.ok) {
    return NextResponse.json({ error: displayNameV.error }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();

  // Check for existing email or username
  const existing = await db.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { username: usernameV.value }],
    },
  });
  if (existing) {
    if (existing.email === normalizedEmail) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "This username is taken" }, { status: 409 });
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 12);

  // Pick a random avatar color + emoji for new writers
  const avatarPalette = [
    { color: "#f59e0b", emoji: "✍️" },
    { color: "#7c3aed", emoji: "🌙" },
    { color: "#f43f5e", emoji: "🖋️" },
    { color: "#0ea5e9", emoji: "🌊" },
    { color: "#10b981", emoji: "🔍" },
    { color: "#fb923c", emoji: "🔥" },
  ];
  const pick = avatarPalette[Math.floor(Math.random() * avatarPalette.length)];

  const user = await db.user.create({
    data: {
      username: usernameV.value,
      displayName: displayNameV.value,
      email: normalizedEmail,
      passwordHash,
      avatarColor: pick.color,
      avatarEmoji: pick.emoji,
      isWriter: true,
      role: "USER",
      bio: sanitizeText(``) || "",
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
    },
  });
}
