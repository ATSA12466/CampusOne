"use client";

import { useRouter } from "next/navigation";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { appConfig } from "@/config/app-config";
import { images } from "@/config/images";
import Link from "next/link";
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
    <div className="mx-auto max-w-5xl space-y-6">
      <MagazineHeader
        eyebrow="MAKE IT YOURS"
        title="Your campus. Your preferences."
        description="Choose your appearance, revisit the introduction and understand what stays on this device."
        image={images.campusLife}
      />
      <Card>
        <h2 className="font-display text-xl font-semibold">
          Privacy & profile
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Prepared photos, notes, drafts and activity stay with the active
          profile. Demo data is device-local, not encrypted university storage.
          Logout removes this profile’s private workspace; connected services
          must independently enforce privacy and retention.
        </p>
        <Link
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand"
          href="/profile"
        >
          Edit your profile and preferences →
        </Link>
        <p className="mt-3 text-xs text-muted-foreground">
          Animations respect your device’s reduced-motion setting. Theme
          preferences are device-wide; private records are owner-qualified.
        </p>
      </Card>
      <Card>
        <h2 className="font-semibold">Data & backend</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {appConfig.dataSource === "demo" ? (
            <>
              This build runs in <strong>demo mode</strong>: activity stays on
              this device and does not sync between browsers or devices. API
              mode needs a connected backend.
            </>
          ) : (
            <>
              This build runs in <strong>API mode</strong> against{" "}
              <code>{appConfig.apiBaseUrl}</code>. If the backend is
              unreachable, actions fail with a retry — nothing is silently
              stored locally as server data.
            </>
          )}
        </p>
      </Card>
      <Card>
        <h2 className="font-semibold">Appearance</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Choose a theme, or follow your device. Your preference is saved on
          this device.
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
          Sign-out clears this local profile, role and account activity. API
          mode also requests server sign-out.
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
