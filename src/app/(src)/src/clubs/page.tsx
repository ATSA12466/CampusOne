import { pageMetadata } from "@/config/metadata";
import { SrcClubs } from "@/features/src-dashboard/clubs";

export const metadata = pageMetadata(
  "SRC Club registrations",
  "Review student club registrations, record approval decisions and manage the SRC club intake.",
);
export const dynamic = "force-dynamic";

export default function SrcClubsPage() {
  return <SrcClubs />;
}
