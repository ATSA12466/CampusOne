"use client";
import { useState } from "react";
import { clubActionService } from "@/services";
import { appConfig } from "@/config/app-config";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui";
import type { Club, ClubCatalog } from "@/types";
import { useClubActivity } from "./hooks/use-club-activity";
import { useClubMutations } from "./hooks/use-club-mutations";
import { useClubDirectory } from "./hooks/use-club-directory";
import { DirectoryHero } from "./components/directory-hero";
import { DirectoryResults } from "./components/directory-results";
import { ExecutiveRequestsPanel } from "./components/executive-requests-panel";
import { RequestDialog } from "./components/request-dialog";
export function ClubsFeature({ initial }: { initial: ClubCatalog }) {
  const user = useAuthStore((s) => s.user),
    role = useAuthStore((s) => s.role),
    activity = useClubActivity(),
    action = useClubMutations(activity.refresh);
  const state = useClubDirectory(initial, activity, user?.id),
    [selection, setSelection] = useState<{ club: Club; owner: string } | null>(null);
  const executive = ["club-executive", "administrator"].includes(role);
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-6">
      <DirectoryHero count={state.catalog.page?.total} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand uppercase">
            A little curiosity goes a long way
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
            A community for your kind of thing.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Start with an interest. Try something new. Your next good conversation might be here.
          </p>
        </div>
        {executive ? (
          <Button asChild variant="secondary">
            <a href="#executive-reviews">Membership reviews</a>
          </Button>
        ) : null}
      </div>
      {appConfig.dataSource === "demo" ? (
        <p className="rounded-control border border-border bg-surface-muted p-4 text-xs leading-relaxed text-muted-foreground">
          Demo communities · All groups, member counts, people, venues and fees are fictional.
          Generated scenes are illustrative; nothing here enrolls you in a real GCTU club.
        </p>
      ) : null}
      <DirectoryResults
        state={state}
        activity={activity}
        action={action}
        user={user}
        onRequest={(club) => user && setSelection({ club, owner: `${user.id}:${user.email}` })}
      />
      {executive ? (
        <ExecutiveRequestsPanel
          clubs={state.clubs}
          pendingRequests={activity.memberships.filter((item) => item.status === "pending")}
          busy={!!action.busy}
          onReview={(id, status) =>
            void action.run(
              `review:${id}`,
              (signal) => clubActionService.review(id, status, { signal }),
              `${clubActionService.source === "demo" ? "Demo " : ""}Membership ${status === "approved" ? "approved" : "declined"}`,
            )
          }
        />
      ) : null}
      {selection && selection.owner === (user ? `${user.id}:${user.email}` : null) ? (
        <RequestDialog
          key={`${selection.club.id}:${selection.owner}`}
          club={selection.club}
          action={action}
          onClose={() => setSelection(null)}
        />
      ) : null}
    </div>
  );
}
