import { routeMetadata } from "@/config/metadata";
import { ParticipationFeature } from "@/features/participation";
export const metadata = routeMetadata("participation");

export default function ParticipationPage() {
  return <ParticipationFeature />;
}
