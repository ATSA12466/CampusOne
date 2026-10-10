import { routeMetadata } from "@/config/metadata";
import { SrcOfficeFeature } from "@/features/src-office";
export const metadata = routeMetadata("src-office");

export default function SrcOfficePage() {
  return <SrcOfficeFeature />;
}
