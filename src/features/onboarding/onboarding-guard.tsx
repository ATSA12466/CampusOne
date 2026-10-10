"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function OnboardingGuard() {
  const router = useRouter();
  const completed = useOnboardingStore((state) => state.completed);
  const hydrated = useOnboardingStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!completed) {
      router.replace("/onboarding");
    }
  }, [completed, hydrated, router]);

  return null;
}
