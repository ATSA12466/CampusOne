import { pageMetadata } from "@/config/metadata";
import { SrcContent } from "@/features/src-dashboard/content";

export const metadata = pageMetadata(
  "SRC Content",
  "Publish SRC announcements and maintain the executive office profiles.",
);
export const dynamic = "force-dynamic";

export default function SrcContentPage() {
  return <SrcContent />;
}
