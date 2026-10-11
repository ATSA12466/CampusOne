"use client";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { images } from "@/config/images";
import { useCampusFeed } from "@/features/campus-feed/hooks/use-campus-feed";
import { SourceFeedback } from "@/features/campus-feed/components/source-feedback";
import { SrcRepresentativesPanel } from "./components/src-representatives-panel";
import { SrcProjectsPanel } from "./components/src-projects-panel";
import { SrcRequestForm } from "./components/src-request-form";
import type { CampusFeed } from "@/types/campus-feed";
export function SrcOfficeFeature({
  representatives,
  projects,
}: {
  representatives: CampusFeed<"representatives">;
  projects: CampusFeed<"projects">;
}) {
  const reps = useCampusFeed("representatives", representatives),
    work = useCampusFeed("projects", projects);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <MagazineHeader
        eyebrow="STUDENT VOICES"
        title="A campus that listens."
        description="Meet the responsibilities, follow the work and keep track of your requests."
        image={images.clubService}
      />
      <p className="text-xs text-muted-foreground">
        Illustrative student leadership, not verified officeholders or official
        SRC processing. Authorized SRC artwork is still pending; no logo has
        been invented.
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <SourceFeedback
            count={reps.items.length}
            total={reps.total}
            error={reps.failure || reps.error}
            busy={reps.busy}
            more={reps.hasMore}
            retry={() => void reps.retry()}
            load={() => void reps.load(true)}
          />
          <SrcRepresentativesPanel representatives={reps.items} />
          <SourceFeedback
            count={work.items.length}
            total={work.total}
            error={work.failure || work.error}
            busy={work.busy}
            more={work.hasMore}
            retry={() => void work.retry()}
            load={() => void work.load(true)}
          />
          <SrcProjectsPanel projects={work.items} />
        </div>
        <SrcRequestForm />
      </div>
    </div>
  );
}
