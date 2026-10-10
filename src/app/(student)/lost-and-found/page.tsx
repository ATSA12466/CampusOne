import { routeMetadata } from "@/config/metadata";
import { LostAndFoundFeature } from "@/features/lost-and-found";
export const metadata = routeMetadata("lost-and-found");

export default function LostAndFoundPage() {
  return <LostAndFoundFeature />;
}
