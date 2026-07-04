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

// POST /api/admin/security/unblock/[ip]?userId=...  — remove an IP from the blocklist
export async function POST(req: NextRequest, { params }: { params: Promise<{ ip: string }> }) {
  const { ip: rawIp } = await params;
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const ip = decodeURIComponent(rawIp);

  // Delete the block (if it exists)
  await db.blockedIp.deleteMany({ where: { ip } });

  // Log the unblock
  await db.securityEvent.create({
    data: {
      ip,
      path: "/admin/security/unblock",
      method: "POST",
      userAgent: "",
      referer: "",
      type: "BLOCKED",
      severity: "LOW",
      blocked: false,
      metadata: JSON.stringify({ reason: "Manual admin unblock", adminId: admin.id }),
    },
  });

  return NextResponse.json({ ok: true, ip });
}
