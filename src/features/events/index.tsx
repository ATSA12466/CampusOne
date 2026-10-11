"use client";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { appConfig } from "@/config/app-config";
import { CampusClockProvider, useCampusClock } from "@/components/providers/campus-clock";
import type { EventCatalog } from "@/types";
import { useEventActivity } from "./hooks/use-event-activity";
import { useEventMutations } from "./hooks/use-event-mutations";
import { useEventDirectory } from "./hooks/use-event-directory";
import { EventDirectoryHero } from "./components/directory-hero";
import { EventDirectoryResults } from "./components/directory-results";
import { EventDialogs, eventOwner, type EventIntent } from "./components/event-dialogs";
export function EventsFeature({ initial }: { initial: EventCatalog }) {
  return (
    <CampusClockProvider initialNow={initial.now}>
      <EventDirectory initial={initial} />
    </CampusClockProvider>
  );
}
function EventDirectory({ initial }: { initial: EventCatalog }) {
  const user = useAuthStore((s) => s.user),
    now = useCampusClock(),
    activity = useEventActivity(),
    action = useEventMutations(activity.refresh),
    state = useEventDirectory(initial, activity, now),
    [intent, setIntent] = useState<EventIntent | null>(null);
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-6">
      <EventDirectoryHero count={state.catalog.page?.total} />
      <div>
        <p className="text-[10px] font-bold tracking-widest text-brand uppercase">
          There&apos;s more to the week
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
          A good plan starts with a little curiosity.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Find your kind of gathering, keep a few for later and make room for something new.
        </p>
      </div>
      {appConfig.dataSource === "demo" ? (
        <p className="rounded-control border border-border bg-surface-muted p-4 text-xs leading-relaxed text-muted-foreground">
          Fictional demo events · All listings, people, locations, fees and attendance counts are
          illustrative. RSVPs stay on this device. Demo QR previews are not valid for entry.
        </p>
      ) : null}
      <EventDirectoryResults
        state={state}
        activity={activity}
        action={action}
        user={user}
        now={now}
        onRsvp={(event) => user && setIntent({ event, owner: eventOwner(), kind: "rsvp" })}
      />
      {action.error && !intent ? (
        <p className="text-sm text-danger" role="alert">
          {action.error}
        </p>
      ) : null}
      <EventDialogs intent={intent} action={action} onClose={() => setIntent(null)} />
    </div>
  );
}
