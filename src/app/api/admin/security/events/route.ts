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

// GET /api/admin/security/events?userId=...&limit=50&type=HONEYPOT
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 50), 200);
  const type = req.nextUrl.searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (type && type !== "ALL") where.type = type;

  const events = await db.securityEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ events });
}
