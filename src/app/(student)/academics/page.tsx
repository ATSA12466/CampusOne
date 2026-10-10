import { routeMetadata } from "@/config/metadata";
import { AcademicsFeature } from "@/features/academics";

export const metadata = routeMetadata("academics");

export default function AcademicsPage() {
  return <AcademicsFeature />;
}
