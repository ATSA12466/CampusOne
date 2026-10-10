import { routeMetadata } from "@/config/metadata";
import { OnboardingExperience } from "@/features/onboarding";

export const metadata = routeMetadata("onboarding");

export default function OnboardingPage() {
  return <OnboardingExperience />;
}
