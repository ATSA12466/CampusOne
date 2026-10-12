import type { ReactNode } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { adminNav } from "@/features/platform-admin/nav";
import { currentServerUser } from "@/server/guards";
import { adminDashboardPermissions, can } from "@/server/permissions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentServerUser();
  const allowed = !!user && adminDashboardPermissions.some((p) => can(user, p));
  return (
    <AdminShell
      area="The Super Admin dashboard"
      title="Super Admin"
      strapline="Platform administration"
      nav={adminNav}
      userName={user?.name ?? null}
      allowed={allowed}
    >
      {children}
    </AdminShell>
  );
}
