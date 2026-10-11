"use client";
import Link from "next/link";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { Card } from "@/components/ui/card";
import { images } from "@/config/images";
import { useAuthStore } from "@/stores/auth-store";
import { OwnedProfile } from "./components/profile-content";
export function ProfileFeature() {
  const user = useAuthStore((s) => s.user),
    hydrated = useAuthStore((s) => s.hydrated),
    source = useAuthStore((s) => s.source);
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <MagazineHeader
        eyebrow="YOUR CAMPUS, YOUR STORY"
        title="A little more you."
        description="The things you care about, the people you connect with and the plans you are making."
        image={images.campusLife}
      />
      {!hydrated ? (
        <p role="status">Restoring your profile…</p>
      ) : !user ? (
        <Card>
          <h2 className="font-display text-2xl">Your story starts here.</h2>
          <p className="my-3 text-sm text-muted-foreground">
            Sign in to edit a profile and see your private activity.
          </p>
          <Link
            className="inline-flex min-h-11 items-center text-brand"
            href="/sign-in?next=%2Fprofile"
          >
            Sign in to your profile →
          </Link>
        </Card>
      ) : (
        <OwnedProfile key={`${source}:${user.id}:${user.email}:${user.role}`} />
      )}
    </div>
  );
}
