"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Card } from "@/components/ui";
import { useAuthStore } from "@/stores/auth-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function SettingsFeature() {
  const router = useRouter();
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Preferences, onboarding replay, and demo account actions." />
      <Card>
        <h2 className="font-semibold">Onboarding</h2>
        <p className="mt-1 text-sm text-slate-600">Replay the product introduction any time.</p>
        <Button className="mt-3" variant="secondary" onClick={() => { resetOnboarding(); router.push('/onboarding'); }}>
          Replay onboarding
        </Button>
      </Card>
      <Card>
        <h2 className="font-semibold">Session</h2>
        <p className="mt-1 text-sm text-slate-600">Demo sign-out clears local account state.</p>
        <Button className="mt-3" variant="danger" onClick={() => { signOut(); router.push('/sign-in'); }}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}
