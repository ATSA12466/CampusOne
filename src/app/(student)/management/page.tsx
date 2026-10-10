import { routeMetadata } from "@/config/metadata";
import { ManagementFeature } from "@/features/management";
export const metadata = routeMetadata("management");

export default function ManagementPage() {
  return <ManagementFeature />;
}
