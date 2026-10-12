import { NextResponse } from "next/server";
import { limited, requirePermission } from "@/server/guards";
import { adminRegistry } from "@/server/admin";

export async function GET(request: Request) {
  const hit = limited(request, "admin:users:list", 120);
  if (hit) return hit;
  const guarded = await requirePermission("platform.users.manage");
  if (guarded instanceof NextResponse) return guarded;
  const query = new URL(request.url).searchParams.get("q") ?? undefined;
  return NextResponse.json({ items: adminRegistry.listUsers(query).slice(0, 100) });
}
