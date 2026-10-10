import { routeMetadata } from "@/config/metadata";
import { HomeFeature } from "@/features/home";

export const metadata = routeMetadata("home");

export default function HomePage() {
  return <HomeFeature />;
}
