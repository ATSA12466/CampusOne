import { pageMetadata } from "@/config/metadata";
import { AdminSettings } from "@/features/platform-admin/settings";

export const metadata = pageMetadata(
  "Admin Settings",
  "Platform support contact, banners and maintenance messaging.",
);
export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return <AdminSettings />;
}
