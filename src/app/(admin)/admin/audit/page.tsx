import { pageMetadata } from "@/config/metadata";
import { AdminAudit } from "@/features/platform-admin/audit";

export const metadata = pageMetadata(
  "Admin Audit log",
  "Append-only history of CampusOne administrative actions.",
);
export const dynamic = "force-dynamic";

export default function AdminAuditPage() {
  return <AdminAudit />;
}
