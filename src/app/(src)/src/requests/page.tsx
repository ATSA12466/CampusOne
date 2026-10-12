import { pageMetadata } from "@/config/metadata";
import { SrcRequests } from "@/features/src-dashboard/requests";

export const metadata = pageMetadata(
  "SRC Student requests",
  "Triage student concerns, welfare cases and questions with owners and resolutions.",
);
export const dynamic = "force-dynamic";

export default function SrcRequestsPage() {
  return <SrcRequests />;
}
