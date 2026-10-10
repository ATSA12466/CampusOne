import { routeMetadata } from "@/config/metadata";
import { MediaFeature } from "@/features/media";
export const metadata = routeMetadata("media");

export default function MediaPage() {
  return <MediaFeature />;
}
