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

import { NextRequest, NextResponse } from "next/server";

// In-memory rate limit store (per-instance).
// For multi-instance deployments, swap this for Redis or Upstash.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = {
  default: 60, // 60 req/min per IP for general endpoints
  write: 20, // 20 req/min per IP for write endpoints (likes, comments, uploads)
  auth: 10, // 10 req/min per IP for sensitive endpoints
};

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Garbage-collect expired buckets every 5 minutes
const GC_INTERVAL = 5 * 60_000;
let lastGc = Date.now();
function gc() {
  const now = Date.now();
  if (now - lastGc < GC_INTERVAL) return;
  lastGc = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

function rateLimit(ip: string, route: string, max: number): { allowed: boolean; remaining: number; resetAt: number } {
  gc();
  const key = `${ip}:${route}`;
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: max - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  existing.count++;
  if (existing.count > max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  return { allowed: true, remaining: max - existing.count, resetAt: existing.resetAt };
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Content Security Policy — restricts where scripts/styles/assets can load from
const CSP = [
  "default-src 'self'",
  // Allow inline styles (Tailwind requires this) and style attributes
  "style-src 'self' 'unsafe-inline'",
  // Allow inline scripts for Next.js hydration, but no external origins
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Images: self + data: URIs (for canvas/QR) + https (for any external book covers)
  "img-src 'self' data: https: blob:",
  // Fonts: self only
  "font-src 'self' data:",
  // Connect: self only (no external API calls from the browser)
  "connect-src 'self'",
  // No external frames
  "frame-ancestors 'self'",
  // No form submissions to external origins
  "form-action 'self'",
  // No plugins
  "object-src 'none'",
  // Restrict base
  "base-uri 'self'",
].join("; ");

export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const ip = getClientIp(req);
  const path = req.nextUrl.pathname;

  // Apply CSP and other security headers to every response
  res.headers.set("Content-Security-Policy", CSP);
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );

  // Rate limit API routes
  if (path.startsWith("/api/")) {
    let max = RATE_LIMIT_MAX.default;
    if (path.includes("/upload") || path.includes("/like") || path.includes("/comments") || path.includes("/share")) {
      max = RATE_LIMIT_MAX.write;
    }
    if (path.includes("/admin/")) {
      max = RATE_LIMIT_MAX.write;
    }

    const rl = rateLimit(ip, path, max);
    res.headers.set("X-RateLimit-Limit", String(max));
    res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    res.headers.set("X-RateLimit-Reset", String(rl.resetAt));

    if (!rl.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please slow down.",
          retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rl.resetAt),
            "Content-Security-Policy": CSP,
          },
        }
      );
    }
  }

  // Block access to dotfiles (e.g. .env, .git) just in case
  if (path.includes("/.")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return res;
}

export const config = {
  matcher: [
    // Apply to all routes except static assets
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-192.png|icon-512.png|icon-maskable-512.png|apple-touch-icon.png|favicon-16.png|favicon-32.png|og-image.png|manifest.json|robots.txt|sitemap.xml).*)",
  ],
};
