import { pageMetadata } from "@/config/metadata";
import { AdminOverview } from "@/features/platform-admin/overview";

export const metadata = pageMetadata(
  "Super Admin",
  "Platform overview: users, housing verification, moderation, branding and system health.",
);
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminOverview />;
}
