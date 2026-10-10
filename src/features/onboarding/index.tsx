"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { onboardingSteps } from "./data/onboarding-steps";
import { StepCard } from "./components/step-card";

export function OnboardingExperience() {
  const router = useRouter();
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const [index, setIndex] = useState(0);

  const step = onboardingSteps[index];
  const progress = useMemo(() => ((index + 1) / onboardingSteps.length) * 100, [index]);

  const finish = () => {
    completeOnboarding();
    router.push("/home");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CampusOne onboarding</h1>
          <p className="text-sm text-slate-600">Step {index + 1} of {onboardingSteps.length}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/sign-in")}>Sign in</Button>
          <Button variant="ghost" onClick={finish}>Skip introduction</Button>
        </div>
      </header>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-[var(--color-royal-blue)] transition-all" style={{ width: `${progress}%` }} />
      </div>

      <StepCard title={step.title} description={step.description} accent={step.accent} Icon={step.icon} />

      <div className="mt-6 flex items-center justify-between">
        <Button variant="secondary" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
          Back
        </Button>
        {index === onboardingSteps.length - 1 ? (
          <Button onClick={finish}>Finish and continue</Button>
        ) : (
          <Button onClick={() => setIndex((value) => Math.min(onboardingSteps.length - 1, value + 1))}>Continue</Button>
        )}
      </div>
    </div>
  );
}
