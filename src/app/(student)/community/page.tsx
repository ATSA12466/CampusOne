import { routeMetadata } from "@/config/metadata";
import { CommunityFeature } from "@/features/community";
export const metadata = routeMetadata("community");

export default function CommunityPage() {
  return <CommunityFeature />;
}
