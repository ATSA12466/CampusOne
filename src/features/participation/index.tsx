"use client";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { images } from "@/config/images";
import { ParticipationRecords } from "./records";
export function ParticipationFeature() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <MagazineHeader
        eyebrow="YOUR PLACE IN CAMPUS LIFE"
        title="Small steps. Shared experiences."
        description="See membership progress and saved event plans without inventing awards or attendance."
        image={images.clubSport}
      />
      <ParticipationRecords />
      <p className="text-xs text-muted-foreground">
        Memberships and plans are source/owner-qualified. No fabricated
        “Attendance Verified” or contributor badge is issued.
      </p>
    </div>
  );
}
