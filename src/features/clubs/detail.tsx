"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { clubActionService } from "@/services";
import { appConfig } from "@/config/app-config";
import { useAuthStore } from "@/stores/auth-store";
import { ErrorState } from "@/components/shared/error-state";
import type { Club } from "@/types";
import { useClubActivity } from "./hooks/use-club-activity";
import { useClubMutations } from "./hooks/use-club-mutations";
import { DetailHero } from "./components/detail-hero";
import { ClubFacts } from "./components/club-facts";
import { DetailStories } from "./components/detail-stories";
import { MembershipActions } from "./components/membership-actions";
import { RequestDialog } from "./components/request-dialog";
export function ClubDetailFeature({ club }: { club: Club }) {
  const user = useAuthStore((s) => s.user),
    activity = useClubActivity(),
    action = useClubMutations(activity.refresh),
    [requestOwner, setRequestOwner] = useState<string | null>(null);
  const requesting = !!user && requestOwner === `${user.id}:${user.email}`;
  const saved = activity.savedIds.includes(club.id),
    membership = activity.memberships.find(
      (item) => item.clubId === club.id && item.userId === user?.id,
    );
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-36 lg:pb-6">
      <Link
        prefetch={false}
        href="/clubs"
        className="inline-flex min-h-11 items-center gap-2 rounded-control text-sm font-semibold text-brand"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to clubs
      </Link>
      <DetailHero
        club={club}
        saved={saved}
        disabled={!user || !!action.busy || activity.loading || !!activity.error}
        onSave={() =>
          void action.run(
            `save:${club.id}`,
            (signal) => clubActionService.save(club.id, !saved, { signal }),
            saved ? "Club removed from saved" : "Club saved",
          )
        }
      />
      <ClubFacts club={club} />
      {appConfig.dataSource === "demo" ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Fictional demo club · Locations, fees, members and coordinators are illustrative, not a
          verified GCTU listing.
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <DetailStories club={club} />
        <div>
          <MembershipActions
            club={club}
            membership={membership}
            loading={activity.loading}
            unavailable={!!activity.error}
            action={action}
            onRequest={() => user && setRequestOwner(`${user.id}:${user.email}`)}
          />
        </div>
      </div>
      {activity.error ? (
        <ErrorState
          title="Your membership activity needs another try."
          description={activity.error}
          onRetry={activity.refresh}
        />
      ) : null}
      {action.error && !requesting ? (
        <p className="text-sm text-danger" role="alert">
          {action.error}
        </p>
      ) : null}
      {requesting ? (
        <RequestDialog
          key={user ? `${user.id}:${user.email}` : "guest"}
          club={club}
          action={action}
          onClose={() => setRequestOwner(null)}
        />
      ) : null}
    </div>
  );
}
