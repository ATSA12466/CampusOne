import { pageMetadata } from "@/config/metadata";
import { AdminBranding } from "@/features/platform-admin/branding";

export const metadata = pageMetadata(
  "Admin Branding",
  "Manage CampusOne logos, icons, banners, names and brand colors with draft and publish.",
);
export const dynamic = "force-dynamic";

export default function AdminBrandingPage() {
  return <AdminBranding />;
}
