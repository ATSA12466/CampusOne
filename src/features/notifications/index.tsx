"use client";
import Link from "next/link";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { Card } from "@/components/ui/card";
import { images } from "@/config/images";
import { useAuthStore } from "@/stores/auth-store";
import { OwnedNotifications } from "./components/notification-directory";
export function NotificationsFeature() {
  const owner = useAuthStore((s) =>
    s.user && s.hydrated
      ? `${s.source}:${s.user.id}:${s.user.email}:${s.role}`
      : "",
  );
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <MagazineHeader
        eyebrow="YOUR CAMPUS, IN THE LOOP"
        title="A little heads-up."
        description="Useful reminders and campus updates. Keep what matters in view, without the noise."
        image={images.innovationNight}
      />
      {owner ? (
        <OwnedNotifications key={owner} />
      ) : (
        <Card>
          <h2 className="font-display text-2xl">
            Updates stay with your profile.
          </h2>
          <Link
            href="/sign-in?next=%2Fnotifications"
            className="mt-4 inline-flex min-h-11 items-center text-brand"
          >
            Sign in to view notifications
          </Link>
        </Card>
      )}
    </div>
  );
}
