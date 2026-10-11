"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/shared/brand-mark";
import { AppearanceTrigger } from "@/components/theme/appearance-trigger";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { onboardingSteps } from "@/config/onboarding";
import { PhotoStory } from "@/features/auth/components/photo-story";
import { StorageNotice } from "@/features/auth/components/storage-notice";
import { IntroHighlights } from "./components/intro-highlights";
import { ProfileSetup } from "./components/profile-setup";
export function OnboardingExperience({ next = "/home" }: { next?: string }) {
  const router = useRouter(),
    index = useOnboardingStore((state) => state.step),
    hydrated = useOnboardingStore((state) => state.hydrated);
  const heading = useRef<HTMLHeadingElement | null>(null),
    previous = useRef(index);
  const step = onboardingSteps[index];
  useEffect(() => {
    if (previous.current !== index) {
      heading.current?.focus({ preventScroll: true });
      previous.current = index;
    }
  }, [index]);
  const finish = () => {
    useOnboardingStore.getState().completeOnboarding();
    router.replace(next);
  };
  return (
    <main className="auth-page">
      <header className="auth-page-header">
        <BrandMark size="sm" />
        <div className="flex items-center gap-1">
          <Link
            prefetch={false}
            href={`/sign-in?next=${encodeURIComponent(next)}`}
            className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-brand"
          >
            Sign in
          </Link>
          <AppearanceTrigger />
        </div>
      </header>
      <div className="auth-page-grid">
        <PhotoStory {...step} />
        <section className="auth-form-panel" aria-labelledby="onboarding-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="auth-eyebrow">FIVE SMALL STEPS · YOUR CAMPUS</span>
            <Button variant="ghost" size="sm" onClick={finish} disabled={!hydrated}>
              Skip introduction
            </Button>
          </div>
          <h1 id="onboarding-title" className="text-title font-semibold">
            Welcome to CampusOne.
          </h1>
          <div className="mt-5 mb-6">
            <div
              role="progressbar"
              aria-label="Onboarding progress"
              aria-valuemin={0}
              aria-valuemax={5}
              aria-valuenow={index + 1}
              aria-valuetext={`Step ${index + 1} of 5`}
              className="onboarding-steps"
            >
              {onboardingSteps.map((_step, part) => (
                <span key={part} aria-hidden="true" data-active={part <= index} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Step {index + 1} of 5 · Progress stays on this browser.
            </p>
          </div>
          <StorageNotice />
          <h2
            ref={heading}
            tabIndex={-1}
            className="mb-3 rounded-control font-display text-2xl font-semibold outline-none focus-visible:outline-solid"
            aria-live="polite"
          >
            {step.title}
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">{step.description}</p>
          {index === 4 ? (
            <ProfileSetup next={next} onBack={() => useOnboardingStore.getState().setStep(3)} />
          ) : (
            <>
              <IntroHighlights step={index} />
              <div className="mt-7 flex justify-between gap-3">
                <Button
                  variant="secondary"
                  disabled={index === 0 || !hydrated}
                  onClick={() => useOnboardingStore.getState().setStep(index - 1)}
                >
                  Back
                </Button>
                <Button
                  disabled={!hydrated}
                  onClick={() => useOnboardingStore.getState().setStep(index + 1)}
                >
                  Continue
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </>
          )}
          <p className="mt-7 border-t border-border pt-4 text-[11px] text-muted-foreground">
            A local demo, never an official GCTU service. No university password is needed to
            explore.
          </p>
        </section>
      </div>
    </main>
  );
}
