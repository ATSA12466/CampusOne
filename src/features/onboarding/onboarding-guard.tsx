"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { studentReturnPath } from "@/lib/auth/return-path";
export function OnboardingGuard() {
  const router = useRouter(),
    pathname = usePathname();
  const completed = useOnboardingStore((state) => state.completed);
  const hydrated = useOnboardingStore((state) => state.hydrated);
  useEffect(() => {
    if (hydrated && !completed)
      router.replace(`/onboarding?next=${encodeURIComponent(studentReturnPath(pathname))}`);
  }, [completed, hydrated, pathname, router]);
  return null;
}
