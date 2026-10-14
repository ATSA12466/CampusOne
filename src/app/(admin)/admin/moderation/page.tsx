import { pageMetadata } from "@/config/metadata";
import { AdminModeration } from "@/features/platform-admin/moderation";

export const metadata = pageMetadata(
  "Admin Moderation",
  "Review moderation reports from across CampusOne with recorded outcomes.",
);
export const dynamic = "force-dynamic";

export default function AdminModerationPage() {
  return <AdminModeration />;
}
