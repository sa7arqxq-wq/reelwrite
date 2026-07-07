/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// GET /api/me — returns the currently-logged-in user, or null
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ me: null });
  }
  return NextResponse.json({
    me: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarColor: user.avatarColor,
      avatarEmoji: user.avatarEmoji,
      image: user.image,
      bio: user.bio,
      role: user.role,
      banned: user.banned,
      followers: user.followers,
      following: user.following,
      reelsCount: user.reelsCount,
    },
  });
}
