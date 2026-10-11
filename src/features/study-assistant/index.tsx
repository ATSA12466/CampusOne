"use client";
import Link from "next/link";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { Card } from "@/components/ui/card";
import { images } from "@/config/images";
import { useAuthStore } from "@/stores/auth-store";
import { StudyWorkspace } from "./components/study-workspace";
export function StudyAssistantFeature() {
  const owner = useAuthStore((s) =>
    s.user && s.hydrated
      ? `${s.source}:${s.user.id}:${s.user.email}:${s.role}`
      : "",
  );
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <MagazineHeader
        eyebrow="YOUR WEEK, WITH A LITTLE BREATHING ROOM"
        title="Find your study rhythm."
        description="Make a little space for revision, practice and the breaks that keep you going. A thoughtful personal plan, one focused session at a time."
        image={images.studyCorner}
      />
      {owner ? (
        <StudyWorkspace key={owner} />
      ) : (
        <Card>
          <h2 className="font-display text-2xl">
            Your planning space is private.
          </h2>
          <Link
            className="mt-3 inline-flex min-h-11 items-center text-brand"
            href="/sign-in?next=%2Fstudy-assistant"
          >
            Sign in to prepare a study draft
          </Link>
        </Card>
      )}
    </div>
  );
}
