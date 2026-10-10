import { routeMetadata } from "@/config/metadata";
import { SettingsFeature } from "@/features/settings";
export const metadata = routeMetadata("settings");

export default function SettingsPage() {
  return <SettingsFeature />;
}
