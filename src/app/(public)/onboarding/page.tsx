import { routeMetadata } from "@/config/metadata";
import { studentReturnPath } from "@/lib/auth/return-path";
import { OnboardingExperience } from "@/features/onboarding";
export const metadata = routeMetadata("onboarding");
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return <OnboardingExperience next={studentReturnPath(query.next)} />;
}
