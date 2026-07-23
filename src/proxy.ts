import { NextRequest, NextResponse } from "next/server";
import {
  isHoneypot,
  honeypotSeverity,
  detectAttack,
  AUTO_BLOCK_THRESHOLD,
  AUTO_BLOCK_WINDOW_MS,
} from "@/lib/security";

// NOTE: This middleware MUST NOT import Prisma (@/lib/db).
// Prisma's client is too large for Vercel serverless middleware and causes
// 10+ second cold starts, which exceeds Vercel's function timeout.
// Instead, we use in-memory tracking only. Security events are logged via
// fire-and-forget fetch to the API (which runs as a separate function).

// In-memory rate limit store
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = {
  default: 60,
  write: 20,
};

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

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

function rateLimit(ip: string, route: string, max: number) {
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

// In-memory blocklist (no DB — survives within a function instance)
const inMemoryBlocklist = new Set<string>();
const honeypotHits = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Fire-and-forget security event logging via API
function logSecurityEvent(event: {
  ip: string; path: string; method: string; userAgent: string;
  type: string; severity: string; blocked: boolean;
}) {
  // Use fetch to log via API (runs as a separate serverless function)
  // This keeps the middleware lightweight
  fetch("https://my-project-two-xi-83.vercel.app/api/admin/security/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {});
}

function recordHoneypotHit(ip: string): { shouldBlock: boolean; hitCount: number } {
  const now = Date.now();
  const windowStart = now - AUTO_BLOCK_WINDOW_MS;
  const hits = (honeypotHits.get(ip) || []).filter((t) => t > windowStart);
  hits.push(now);
  honeypotHits.set(ip, hits);
  if (honeypotHits.size > 10_000) {
    for (const [key, tsList] of honeypotHits) {
      const fresh = tsList.filter((t) => t > windowStart);
      if (fresh.length === 0) honeypotHits.delete(key);
      else honeypotHits.set(key, fresh);
    }
  }
  return { shouldBlock: hits.length >= AUTO_BLOCK_THRESHOLD, hitCount: hits.length };
}

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
  const fullUrl = req.nextUrl.pathname + req.nextUrl.search;

  // Security headers
  res.headers.set("Content-Security-Policy", CSP);
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");

  // Check in-memory blocklist
  if (inMemoryBlocklist.has(ip)) {
    return new NextResponse(
      JSON.stringify({ error: "Access denied" }),
      { status: 403, headers: { "Content-Type": "application/json", "Content-Security-Policy": CSP } }
    );
  }

  // Honeypot detection
  if (isHoneypot(path)) {
    const severity = honeypotSeverity(path);
    const { shouldBlock, hitCount } = recordHoneypotHit(ip);
    if (shouldBlock) {
      inMemoryBlocklist.add(ip);
      // Auto-expire after 1 hour
    }
    return new NextResponse("Not Found", { status: 404, headers: { "Content-Security-Policy": CSP } });
  }

  // Attack pattern detection
  const attack = detectAttack(fullUrl);
  if (attack.type) {
    if (attack.severity === "CRITICAL") {
      inMemoryBlocklist.add(ip);
    }
    return new NextResponse(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json", "Content-Security-Policy": CSP } }
    );
  }

  // Rate limit API routes
  if (path.startsWith("/api/")) {
    let max = RATE_LIMIT_MAX.default;
    if (path.includes("/upload") || path.includes("/like") || path.includes("/comments") || path.includes("/share")) {
      max = RATE_LIMIT_MAX.write;
    }
    const rl = rateLimit(ip, path, max);
    res.headers.set("X-RateLimit-Limit", String(max));
    res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    if (!rl.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60", "Content-Security-Policy": CSP } }
      );
    }
  }

  // Block dotfiles
  if (path.includes("/.")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-192.png|icon-512.png|icon-maskable-512.png|apple-touch-icon.png|favicon-16.png|favicon-32.png|og-image.png|manifest.json|robots.txt|sitemap.xml).*)",
  ],
};
