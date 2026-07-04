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

// POST /api/admin/security/block/[ip]?userId=...  — manually block an IP for 24h
export async function POST(req: NextRequest, { params }: { params: Promise<{ ip: string }> }) {
  const { ip: rawIp } = await params;
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Decode the IP (it comes URL-encoded)
  const ip = decodeURIComponent(rawIp);
  if (!ip || ip.length > 100) {
    return NextResponse.json({ error: "Invalid IP" }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await db.blockedIp.upsert({
    where: { ip },
    create: { ip, reason: `Manually blocked by admin ${admin.username}`, expiresAt },
    update: { reason: `Manually blocked by admin ${admin.username}`, expiresAt },
  });

  // Log the manual block
  await db.securityEvent.create({
    data: {
      ip,
      path: "/admin/security/block",
      method: "POST",
      userAgent: "",
      referer: "",
      type: "BLOCKED",
      severity: "HIGH",
      blocked: true,
      metadata: JSON.stringify({ reason: "Manual admin block", adminId: admin.id }),
    },
  });

  return NextResponse.json({ ok: true, ip, expiresAt });
}
