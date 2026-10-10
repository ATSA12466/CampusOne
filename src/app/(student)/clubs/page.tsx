import { routeMetadata } from "@/config/metadata";
import { ClubsFeature } from "@/features/clubs";
export const metadata = routeMetadata("clubs");

export default function ClubsPage() {
  return <ClubsFeature />;
}
