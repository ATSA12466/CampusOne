import type { ReactNode } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { srcNav } from "@/features/src-dashboard/nav";
import { currentServerUser } from "@/server/guards";
import { can, srcDashboardPermissions } from "@/server/permissions";

export const dynamic = "force-dynamic";

export default async function SrcLayout({ children }: { children: ReactNode }) {
  const user = await currentServerUser();
  const allowed = !!user && srcDashboardPermissions.some((p) => can(user, p));
  return (
    <AdminShell
      area="The SRC administration dashboard"
      title="SRC Dashboard"
      strapline="Student representation workspace"
      nav={srcNav}
      userName={user?.name ?? null}
      allowed={allowed}
    >
      {children}
    </AdminShell>
  );
}
