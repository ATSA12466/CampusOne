import { NextResponse } from "next/server";
import { limited, requireAnyPermission } from "@/server/guards";
import { srcDashboardPermissions } from "@/server/permissions";
import { registry } from "@/server/registry";
import { store } from "@/server/store";
import type { AuditEntry } from "@/server/types";

export async function GET(request: Request) {
  const hit = limited(request, "src:overview", 120);
  if (hit) return hit;
  const guarded = await requireAnyPermission(srcDashboardPermissions);
  if (guarded instanceof NextResponse) return guarded;
  const pendingClubs = registry.listClubs("pending").length;
  const pendingNominations = registry.listNominations("pending").length;
  const activeAppointments = registry.listAppointments("active").length;
  const publishedAnnouncements = registry.publishedAnnouncements().length;
  const openRequests = registry.listRequests().filter((r) => r.status === "new" || r.status === "in-review").length;
  const recent = store
    .all<AuditEntry>("audit")
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);
  return NextResponse.json({
    counts: {
      pendingClubs,
      pendingNominations,
      activeAppointments,
      publishedAnnouncements,
      openRequests,
    },
    recent,
  });
}
