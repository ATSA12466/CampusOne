"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Card } from "@/components/ui";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";
import { StorageNotice } from "@/features/auth/components/storage-notice";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

export function SettingsFeature() {
  const router = useRouter();
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const logout = useSignOut();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Preferences, onboarding replay, and demo account actions."
      />
      <Card>
        <h2 className="font-semibold">Appearance</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Choose a theme, or follow your device. Your preference is saved on this device.
        </p>
        <ThemeSwitcher />
      </Card>
      <Card>
        <h2 className="font-semibold">Onboarding</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Replay the product introduction any time.
        </p>
        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => {
            resetOnboarding();
            router.push("/onboarding");
          }}
        >
          Replay onboarding
        </Button>
      </Card>
      <Card>
        <h2 className="font-semibold">Session</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign-out clears this local profile, role and account activity. API mode also requests
          server sign-out.
        </p>
        <Button
          className="mt-3"
          variant="danger"
          disabled={logout.pending}
          onClick={() => void logout.signOut()}
        >
          {logout.pending ? "Signing out…" : "Sign out"}
        </Button>
        <div className="mt-3">
          <StorageNotice />
          {logout.error ? (
            <p role="alert" className="text-sm text-danger">
              {logout.error}
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
