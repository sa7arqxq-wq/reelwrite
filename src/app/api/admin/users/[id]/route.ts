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

// PATCH /api/admin/users/[id]  body: { userId, action, value? }
//   action: "promote"   -> role = ADMIN
//   action: "demote"    -> role = USER
//   action: "ban"       -> banned = true
//   action: "unban"     -> banned = false
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  // Prevent self-ban / self-demotion to avoid lockout
  if (id === admin.id && (action === "demote" || action === "ban")) {
    return NextResponse.json(
      { error: "You cannot demote or ban yourself." },
      { status: 400 }
    );
  }

  let data: Record<string, unknown> = {};
  if (action === "promote") data = { role: "ADMIN" };
  else if (action === "demote") data = { role: "USER" };
  else if (action === "ban") data = { banned: true };
  else if (action === "unban") data = { banned: false };
  else return NextResponse.json({ error: "unknown action" }, { status: 400 });

  const user = await db.user.update({ where: { id }, data });
  return NextResponse.json({ user });
}
