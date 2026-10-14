import { pageMetadata } from "@/config/metadata";
import { SrcOverview } from "@/features/src-dashboard/overview";

export const metadata = pageMetadata(
  "SRC Dashboard",
  "SRC administration overview: pending clubs, nominations, announcements, requests and activity.",
);
export const dynamic = "force-dynamic";

export default function SrcPage() {
  return <SrcOverview />;
}
