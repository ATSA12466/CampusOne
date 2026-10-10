import { routeMetadata } from "@/config/metadata";
import { AccommodationFeature } from "@/features/accommodation";
export const metadata = routeMetadata("accommodation");

export default function AccommodationPage() {
  return <AccommodationFeature />;
}
