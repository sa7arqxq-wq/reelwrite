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
import { db } from "@/lib/db";
import {
  isHoneypot,
  honeypotSeverity,
  detectAttack,
  AUTO_BLOCK_THRESHOLD,
  AUTO_BLOCK_WINDOW_MS,
  AUTO_BLOCK_DURATION_MS,
} from "@/lib/security";

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

// In-memory blocklist cache (synced from DB). Refreshed every 30 seconds.
let blocklistCache: { ips: Set<string>; expiresAt: number } = {
  ips: new Set(),
  expiresAt: 0,
};
const BLOCKLIST_CACHE_TTL = 30_000; // 30 seconds

async function getBlocklist(): Promise<Set<string>> {
  const now = Date.now();
  if (blocklistCache.expiresAt > now) {
    return blocklistCache.ips;
  }
  // Refresh from DB
  try {
    const blocked = await db.blockedIp.findMany({
      where: { expiresAt: { gt: new Date(now) } },
      select: { ip: true },
    });
    const ips = new Set(blocked.map((b) => b.ip));
    blocklistCache = { ips, expiresAt: now + BLOCKLIST_CACHE_TTL };
    return ips;
  } catch {
    // DB not ready (e.g. during build) — fail open with empty set
    return blocklistCache.ips;
  }
}

// Track honeypot hits per IP for auto-blocking (in-memory, rolling window)
const honeypotHits = new Map<string, number[]>(); // ip -> array of timestamps

function recordHoneypotHit(ip: string): { shouldBlock: boolean; hitCount: number } {
  const now = Date.now();
  const windowStart = now - AUTO_BLOCK_WINDOW_MS;
  const hits = (honeypotHits.get(ip) || []).filter((t) => t > windowStart);
  hits.push(now);
  honeypotHits.set(ip, hits);
  // Clean up old entries periodically
  if (honeypotHits.size > 10_000) {
    for (const [key, tsList] of honeypotHits) {
      const fresh = tsList.filter((t) => t > windowStart);
      if (fresh.length === 0) honeypotHits.delete(key);
      else honeypotHits.set(key, fresh);
    }
  }
  return { shouldBlock: hits.length >= AUTO_BLOCK_THRESHOLD, hitCount: hits.length };
}

async function blockIp(ip: string, reason: string): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + AUTO_BLOCK_DURATION_MS);
    // Upsert — if already blocked, extend the expiry
    await db.blockedIp.upsert({
      where: { ip },
      create: { ip, reason, expiresAt },
      update: { reason, expiresAt },
    });
    // Invalidate the cache so the block takes effect immediately
    blocklistCache = { ips: new Set(), expiresAt: 0 };
  } catch {
    // DB not ready — fail silently, the in-memory honeypot tracking still works
  }
}

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

// Log a security event to the DB (fire-and-forget — never block the response)
function logSecurityEvent(event: {
  ip: string;
  path: string;
  method: string;
  userAgent: string;
  referer: string;
  type: string;
  severity: string;
  blocked: boolean;
  metadata?: Record<string, unknown>;
}): void {
  // Fire-and-forget — don't await, don't block
  db.securityEvent
    .create({
      data: {
        ip: event.ip,
        path: event.path.slice(0, 500), // cap length
        method: event.method,
        userAgent: event.userAgent.slice(0, 500),
        referer: event.referer.slice(0, 500),
        type: event.type,
        severity: event.severity,
        blocked: event.blocked,
        metadata: JSON.stringify(event.metadata || {}),
      },
    })
    .catch(() => {
      // Silently ignore DB errors — security logging must never break the request
    });
}

// Content Security Policy — restricts where scripts/styles/assets can load from
const CSP = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const ip = getClientIp(req);
  const path = req.nextUrl.pathname;
  const method = req.method;
  const userAgent = req.headers.get("user-agent") || "";
  const referer = req.headers.get("referer") || "";
  const fullUrl = req.nextUrl.pathname + req.nextUrl.search;

  // Apply security headers to every response
  res.headers.set("Content-Security-Policy", CSP);
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );

  // ===== STEP 1: Check if IP is already blocked =====
  const blocklist = await getBlocklist();
  if (blocklist.has(ip)) {
    logSecurityEvent({
      ip, path, method, userAgent, referer,
      type: "BLOCKED",
      severity: "HIGH",
      blocked: true,
      metadata: { reason: "IP is on blocklist" },
    });
    return new NextResponse(
      JSON.stringify({ error: "Access denied", message: "Your IP has been blocked due to suspicious activity." }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "Content-Security-Policy": CSP,
          "Retry-After": "3600",
        },
      }
    );
  }

  // ===== STEP 2: Honeypot detection =====
  if (isHoneypot(path)) {
    const severity = honeypotSeverity(path);
    const { shouldBlock, hitCount } = recordHoneypotHit(ip);

    logSecurityEvent({
      ip, path, method, userAgent, referer,
      type: "HONEYPOT",
      severity,
      blocked: shouldBlock,
      metadata: { hitCount, autoBlocked: shouldBlock },
    });

    // Auto-block repeat offenders
    if (shouldBlock) {
      await blockIp(ip, `Auto-blocked: ${hitCount} honeypot hits in ${AUTO_BLOCK_WINDOW_MS / 60000}min`);
      logSecurityEvent({
        ip, path, method, userAgent, referer,
        type: "BLOCKED",
        severity: "CRITICAL",
        blocked: true,
        metadata: { reason: "Auto-blocked after repeated honeypot hits", hitCount },
      });
    }

    // Return 404 — don't reveal that this is a honeypot
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Content-Security-Policy": CSP },
    });
  }

  // ===== STEP 3: Attack pattern detection (SQLi, XSS, path traversal, cmd injection) =====
  const attack = detectAttack(fullUrl);
  if (attack.type) {
    logSecurityEvent({
      ip, path: fullUrl, method, userAgent, referer,
      type: attack.type,
      severity: attack.severity,
      blocked: false,
      metadata: { pattern: attack.pattern },
    });
    // For critical attacks (SQLi, cmd injection), auto-block immediately
    if (attack.severity === "CRITICAL") {
      await blockIp(ip, `Auto-blocked: ${attack.type} attempt detected`);
      logSecurityEvent({
        ip, path: fullUrl, method, userAgent, referer,
        type: "BLOCKED",
        severity: "CRITICAL",
        blocked: true,
        metadata: { reason: `Auto-blocked: ${attack.type}`, pattern: attack.pattern },
      });
      return new NextResponse(
        JSON.stringify({ error: "Forbidden", message: "Malicious request detected." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", "Content-Security-Policy": CSP },
        }
      );
    }
    // For high-severity (XSS, path traversal), reject the request but don't block yet
    return new NextResponse(
      JSON.stringify({ error: "Forbidden", message: "Request rejected by security filter." }),
      {
        status: 403,
        headers: { "Content-Type": "application/json", "Content-Security-Policy": CSP },
      }
    );
  }

  // ===== STEP 4: Rate limit API routes =====
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
      logSecurityEvent({
        ip, path, method, userAgent, referer,
        type: "RATE_LIMIT",
        severity: "MEDIUM",
        blocked: false,
        metadata: { limit: max, window: RATE_LIMIT_WINDOW_MS },
      });
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

  // ===== STEP 5: Block access to dotfiles (e.g. .env, .git) as a final safety net =====
  if (path.includes("/.")) {
    logSecurityEvent({
      ip, path, method, userAgent, referer,
      type: "SCAN",
      severity: "HIGH",
      blocked: false,
      metadata: { reason: "Dotfile access attempt" },
    });
    return new NextResponse("Not Found", { status: 404 });
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-192.png|icon-512.png|icon-maskable-512.png|apple-touch-icon.png|favicon-16.png|favicon-32.png|og-image.png|manifest.json|robots.txt|sitemap.xml).*)",
  ],
};
