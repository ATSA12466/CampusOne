import { routeMetadata } from "@/config/metadata";
import { StudyAssistantFeature } from "@/features/study-assistant";

export const metadata = routeMetadata("study-assistant");

export default function StudyAssistantPage() {
  return <StudyAssistantFeature />;
}
