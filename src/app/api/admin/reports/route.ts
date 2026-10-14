import { NextResponse } from "next/server";
import { adminRegistry } from "@/server/admin";
import { limited, requireAnyPermission } from "@/server/guards";

export async function GET(request: Request) {
  const hit = limited(request, "admin:reports:list", 120);
  if (hit) return hit;
  const guarded = await requireAnyPermission(["community.moderate", "platform.users.manage"], request);
  if (guarded instanceof NextResponse) return guarded;
  const status = new URL(request.url).searchParams.get("status") ?? undefined;
  return NextResponse.json({ items: adminRegistry.listReports(status) });
}
