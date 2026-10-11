import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui";
import { ErrorState } from "@/components/shared/error-state";
import { eventActionService } from "@/services";
import { eventCount } from "@/lib/events/schedule";
import type { EventItem, UserProfile } from "@/types";
import type { EventDirectoryState } from "../hooks/use-event-directory";
import type { EventActivityState } from "../hooks/use-event-activity";
import type { EventMutations } from "../hooks/use-event-mutations";
import { EventCard } from "./event-card";
import { EventDirectoryFilters } from "./directory-filters";
import { EventDirectoryEmpty } from "./directory-empty";
import { LoadMoreEvents } from "./load-more-events";
export function EventDirectoryResults({
  state,
  activity,
  action,
  user,
  now,
  onRsvp,
}: {
  state: EventDirectoryState;
  activity: EventActivityState;
  action: EventMutations;
  user: UserProfile | null;
  now: Date;
  onRsvp: (event: EventItem) => void;
}) {
  const [retrying, startRetry] = useTransition(),
    router = useRouter(),
    { catalog, filter, categories, change, results, resultsRef, reset } = state;
  return (
    <section
      id="event-directory"
      aria-labelledby="event-directory-title"
      className="scroll-mt-24 space-y-5"
    >
      <EventDirectoryFilters filter={filter} categories={categories} onChange={change} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <h2
          id="event-directory-title"
          ref={resultsRef}
          tabIndex={-1}
          className="font-display text-xl font-semibold"
        >
          {filter.view === "saved"
            ? "Your saved events"
            : filter.view === "going"
              ? "Your RSVPs"
              : "Explore what’s on"}
        </h2>
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {catalog.error
            ? "Events unavailable"
            : `${results.total} ${results.total === 1 ? "event" : "events"}${results.total ? ` · page ${results.page} of ${results.totalPages}` : ""}`}
        </p>
      </div>
      {catalog.error ? (
        <ErrorState
          title="The events need another moment."
          description={catalog.error}
          onRetry={() => {
            if (!retrying) startRetry(() => router.refresh());
          }}
        />
      ) : !results.total ? (
        <EventDirectoryEmpty view={filter.view} onReset={reset} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.items.map((event) => {
            const going = activity.goingIds.includes(event.id),
              saved = activity.savedIds.includes(event.id);
            return (
              <EventCard
                key={event.id}
                event={event}
                now={now}
                count={eventCount(event, going, eventActionService.source, activity.attendance)}
                going={going}
                saved={saved}
                ready={!!user && !activity.loading && !activity.error}
                busy={!!action.busy}
                onRsvp={() => onRsvp(event)}
                onSave={() =>
                  void action.run(
                    `save:${event.id}`,
                    (signal) => eventActionService.save(event.id, !saved, { signal }),
                    saved ? "Event removed from saved" : "Event saved",
                  )
                }
              />
            );
          })}
        </div>
      )}
      {retrying ? (
        <p role="status" className="text-xs text-muted-foreground">
          Retrying the event calendar…
        </p>
      ) : null}
      {user && activity.loading ? (
        <p role="status" className="text-xs text-muted-foreground">
          Loading your saved events and RSVPs…
        </p>
      ) : null}
      {activity.error ? (
        <ErrorState
          title="Your event plans could not load."
          description={activity.error}
          onRetry={activity.refresh}
        />
      ) : null}
      {!user ? (
        <p className="text-sm text-muted-foreground">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center font-semibold text-brand"
          >
            Sign in
          </Link>{" "}
          to save a plan or RSVP.
        </p>
      ) : null}
      <LoadMoreEvents state={state} />
      {results.totalPages > 1 ? (
        <Pagination
          label="Event results pages"
          page={results.page}
          totalPages={results.totalPages}
          onPageChange={(page) => {
            change({ page });
            requestAnimationFrame(() => resultsRef.current?.focus());
          }}
        />
      ) : null}
    </section>
  );
}
