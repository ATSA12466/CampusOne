import { pageMetadata } from "@/config/metadata";
import { SrcReports } from "@/features/src-dashboard/reports";

export const metadata = pageMetadata(
  "SRC Reports",
  "SRC participation reports: club intake, nomination decisions, request volumes and activity.",
);
export const dynamic = "force-dynamic";

export default function SrcReportsPage() {
  return <SrcReports />;
}
