import { pageMetadata } from "@/config/metadata";
import { AdminUsers } from "@/features/platform-admin/users";

export const metadata = pageMetadata(
  "Admin Users",
  "Search and manage CampusOne accounts: verification, suspension and roles.",
);
export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return <AdminUsers />;
}
