"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { appConfig } from "@/config/app-config";
import { eventActionService } from "@/services";
import { eventCount, eventPhase } from "@/lib/events/schedule";
import { CampusClockProvider, useCampusClock } from "@/components/providers/campus-clock";
import { ErrorState } from "@/components/shared/error-state";
import type { EventItem } from "@/types";
import { useEventActivity } from "./hooks/use-event-activity";
import { useEventMutations } from "./hooks/use-event-mutations";
import { EventDetailHero } from "./components/detail-hero";
import { EventFacts } from "./components/event-facts";
import { EventDetailStories } from "./components/detail-stories";
import { EventActions } from "./components/event-actions";
import { EventNotice } from "./components/event-notice";
import { EventDialogs, eventOwner, type EventIntent } from "./components/event-dialogs";
export function EventDetailFeature({
  event,
  initialNow,
}: {
  event: EventItem;
  initialNow: string;
}) {
  return (
    <CampusClockProvider initialNow={initialNow}>
      <EventDetail event={event} />
    </CampusClockProvider>
  );
}
function EventDetail({ event }: { event: EventItem }) {
  const user = useAuthStore((s) => s.user),
    now = useCampusClock(),
    activity = useEventActivity(),
    action = useEventMutations(activity.refresh),
    [intent, setIntent] = useState<EventIntent | null>(null),
    going = activity.goingIds.includes(event.id),
    saved = activity.savedIds.includes(event.id),
    count = eventCount(event, going, eventActionService.source, activity.attendance),
    ready = !!user && !activity.loading && !activity.error;
  const select = (kind: EventIntent["kind"]) =>
      user && setIntent({ event, owner: eventOwner(), kind }),
    ticketAllowed = !["ended", "cancelled", "unknown"].includes(eventPhase(event, now));
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-56 lg:pb-6">
      <Link
        href="/events"
        prefetch={false}
        className="inline-flex min-h-11 items-center gap-2 rounded-control text-sm font-semibold text-brand"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to events
      </Link>
      <EventDetailHero
        event={event}
        saved={saved}
        disabled={!ready || !!action.busy}
        onSave={() =>
          void action.run(
            `save:${event.id}`,
            (signal) => eventActionService.save(event.id, !saved, { signal }),
            saved ? "Event removed from saved" : "Event saved",
          )
        }
      />
      <EventFacts event={event} />
      <EventNotice event={event} now={now} count={count} going={going} />
      {appConfig.dataSource === "demo" ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Fictional demo event · Programme, hosts, venues, fees and counts are illustrative. Nothing
          here is a real booking, payment or admission credential.
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_290px]">
        <EventDetailStories event={event} />
        <div>
          <EventActions
            event={event}
            now={now}
            count={count}
            going={going}
            ready={ready}
            busy={!!action.busy}
            user={!!user}
            onRsvp={() => select("rsvp")}
            onCancel={() => select("cancel")}
            onTicket={() => select("ticket")}
          />
        </div>
      </div>
      {user && activity.loading ? (
        <p role="status" className="text-xs text-muted-foreground">
          Loading your event plans…
        </p>
      ) : null}
      {activity.error ? (
        <ErrorState
          title="Your event plans could not load."
          description={activity.error}
          onRetry={activity.refresh}
        />
      ) : null}
      {action.error && !intent ? (
        <p className="text-sm text-danger" role="alert">
          {action.error}
        </p>
      ) : null}
      <EventDialogs
        intent={intent?.kind === "ticket" && (!going || !ticketAllowed) ? null : intent}
        action={action}
        onClose={() => setIntent(null)}
      />
    </div>
  );
}
