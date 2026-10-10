import { routeMetadata } from "@/config/metadata";
import { ProfileFeature } from "@/features/profile";
export const metadata = routeMetadata("profile");

export default function ProfilePage() {
  return <ProfileFeature />;
}
