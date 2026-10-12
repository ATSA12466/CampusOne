import { pageMetadata } from "@/config/metadata";
import { AdminAccommodation } from "@/features/platform-admin/accommodation";

export const metadata = pageMetadata(
  "Admin Accommodation",
  "Verify student accommodation listings before they publish to the student app.",
);
export const dynamic = "force-dynamic";

export default function AdminAccommodationPage() {
  return <AdminAccommodation />;
}
