import { pageMetadata } from "@/config/metadata";
import { AdminRoles } from "@/features/platform-admin/roles";

export const metadata = pageMetadata(
  "Admin Roles",
  "Create and revoke scoped permission grants for clubs, events and platform duties.",
);
export const dynamic = "force-dynamic";

export default function AdminRolesPage() {
  return <AdminRoles />;
}
