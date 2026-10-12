import { NextResponse } from "next/server";
import { limited, requirePermission } from "@/server/guards";
import { store } from "@/server/store";
import type { AuditEntry } from "@/server/types";

export async function GET(request: Request) {
  const hit = limited(request, "admin:audit:list", 120);
  if (hit) return hit;
  const guarded = await requirePermission("platform.audit.view", undefined, request);
  if (guarded instanceof NextResponse) return guarded;
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").toLowerCase();
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? "30") || 30));
  const all = store
    .all<AuditEntry>("audit")
    .filter(
      (e) =>
        !query ||
        e.action.toLowerCase().includes(query) ||
        e.targetType.toLowerCase().includes(query) ||
        (e.detail ?? "").toLowerCase().includes(query),
    )
    .sort((a, b) => b.at.localeCompare(a.at));
  return NextResponse.json({
    items: all.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: all.length,
  });
}
