/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// PATCH /api/me/profile-image
// body: { image: string } — base64 data URL or https URL
// Sets the user's profile photo. Pass null/empty to remove.
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { image } = body;

  // Allow null/empty to clear the image
  if (image === null || image === "") {
    const updated = await db.user.update({
      where: { id: user.id },
      data: { image: null },
    });
    return NextResponse.json({ ok: true, image: null });
  }

  // Validate: must be a data URL or https URL
  if (typeof image !== "string") {
    return NextResponse.json({ error: "Image must be a string" }, { status: 400 });
  }

  // Cap the size — base64 data URLs can be large
  // Max ~2MB for profile photos (after client-side compression this should be ~50-200KB)
  if (image.length > 2_000_000) {
    return NextResponse.json(
      { error: "Image is too large. Max 2MB after compression." },
      { status: 413 }
    );
  }

  // Must be a data URL (base64) or an https URL
  const isDataUrl = image.startsWith("data:image/");
  const isHttpsUrl = image.startsWith("https://");
  if (!isDataUrl && !isHttpsUrl) {
    return NextResponse.json(
      { error: "Image must be a data URL or https URL" },
      { status: 400 }
    );
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { image },
  });

  return NextResponse.json({ ok: true, image: updated.image });
}
