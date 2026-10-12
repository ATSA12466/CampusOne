import { NextResponse } from "next/server";
import { limited, requireAnyPermission } from "@/server/guards";
import { adminDashboardPermissions } from "@/server/permissions";
import { adminRegistry } from "@/server/admin";
import { registry } from "@/server/registry";
import { store } from "@/server/store";

export async function GET(request: Request) {
  const hit = limited(request, "admin:overview", 120);
  if (hit) return hit;
  const guarded = await requireAnyPermission(adminDashboardPermissions);
  if (guarded instanceof NextResponse) return guarded;
  const users = store.all<{ status: string }>("users");
  return NextResponse.json({
    counts: {
      users: users.length,
      suspended: users.filter((u) => u.status === "suspended").length,
      pendingListings: adminRegistry.listListings("pending").length,
      openReports: adminRegistry.listReports("open").length,
      materials: adminRegistry.listMaterials("published").length,
      pendingClubs: registry.listClubs("pending").length,
      openRequests: registry.listRequests().filter((r) => r.status === "new" || r.status === "in-review").length,
    },
    health: {
      store: "file",
      sessions: store.all("sessions").length,
      auditEntries: store.all("audit").length,
      database: process.env.DATABASE_URL ? "configured" : "not-configured",
    },
  });
}
