import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function requireAdmin(req: NextRequest) {
  const userId =
    req.nextUrl.searchParams.get("userId") ||
    (req.headers.get("x-user-id") as string | null);
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// GET /api/admin/security/stats?userId=... — security dashboard stats
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last1h = new Date(now.getTime() - 60 * 60 * 1000);

  const [
    totalEvents,
    events24h,
    events1h,
    blockedIps,
    honeypots24h,
    sqli24h,
    xss24h,
    pathTraversal24h,
    criticalEvents24h,
  ] = await Promise.all([
    db.securityEvent.count(),
    db.securityEvent.count({ where: { createdAt: { gte: last24h } } }),
    db.securityEvent.count({ where: { createdAt: { gte: last1h } } }),
    db.blockedIp.count({ where: { expiresAt: { gt: now } } }),
    db.securityEvent.count({ where: { type: "HONEYPOT", createdAt: { gte: last24h } } }),
    db.securityEvent.count({ where: { type: "SQL_INJECTION", createdAt: { gte: last24h } } }),
    db.securityEvent.count({ where: { type: "XSS", createdAt: { gte: last24h } } }),
    db.securityEvent.count({ where: { type: "PATH_TRAVERSAL", createdAt: { gte: last24h } } }),
    db.securityEvent.count({ where: { severity: "CRITICAL", createdAt: { gte: last24h } } }),
  ]);

  // Top attacker IPs (last 24h)
  const topAttackersRaw = await db.securityEvent.groupBy({
    by: ["ip"],
    where: { createdAt: { gte: last24h } },
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // Top attacked paths (last 24h)
  const topPathsRaw = await db.securityEvent.groupBy({
    by: ["path"],
    where: { createdAt: { gte: last24h } },
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // Events by type (last 24h)
  const eventsByTypeRaw = await db.securityEvent.groupBy({
    by: ["type"],
    where: { createdAt: { gte: last24h } },
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
  });

  return NextResponse.json({
    stats: {
      totalEvents,
      events24h,
      events1h,
      blockedIps,
      honeypots24h,
      sqli24h,
      xss24h,
      pathTraversal24h,
      criticalEvents24h,
    },
    topAttackers: topAttackersRaw.map((a) => ({ ip: a.ip, count: a._count._all })),
    topPaths: topPathsRaw.map((p) => ({ path: p.path, count: p._count._all })),
    eventsByType: eventsByTypeRaw.map((t) => ({ type: t.type, count: t._count._all })),
  });
}
