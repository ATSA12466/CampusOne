import { pageMetadata } from "@/config/metadata";
import { AdminContent } from "@/features/platform-admin/content";

export const metadata = pageMetadata(
  "Admin Content",
  "Curate approved course materials for the student Academics section.",
);
export const dynamic = "force-dynamic";

export default function AdminContentPage() {
  return <AdminContent />;
}
