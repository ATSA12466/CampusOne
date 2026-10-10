import type { ReactNode } from "react";
import { StudentShell } from "@/components/layout/student-shell";
import { OnboardingGuard } from "@/features/onboarding/onboarding-guard";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <OnboardingGuard />
      <StudentShell>{children}</StudentShell>
    </>
  );
}
