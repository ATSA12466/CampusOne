"use client";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { useAuthStore } from "@/stores/auth-store";
import { useClubActivity } from "@/features/clubs/hooks/use-club-activity";
import { useEventActivity } from "@/features/events/hooks/use-event-activity";
import { usePrivateCatalog } from "@/features/campus-feed/hooks/use-private-catalog";
export function ParticipationRecords() {
  const user = useAuthStore((s) => s.user),
    clubs = usePrivateCatalog("clubs"),
    events = usePrivateCatalog("events"),
    members = useClubActivity(),
    plans = useEventActivity(),
    rows = user ? members.memberships.filter((m) => m.userId === user.id) : [];
  return (
    <>
      {!user ? (
        <Card>
          <h2 className="font-display text-xl font-semibold">
            Participation belongs to your profile.
          </h2>
          <Link
            className="inline-flex min-h-11 items-center text-brand"
            href="/sign-in?next=%2Fparticipation"
          >
            Sign in to continue →
          </Link>
        </Card>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-xl font-semibold">
              Club participation records
            </h2>
            {members.error || clubs.error ? (
              <div role="alert">
                <p>{members.error || clubs.error}</p>
                <Button
                  onClick={() => {
                    members.refresh();
                    clubs.refresh();
                  }}
                >
                  Retry memberships
                </Button>
              </div>
            ) : members.loading || clubs.loading ? (
              <p role="status" className="mt-4">
                Loading memberships…
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {rows.length ? (
                  rows.map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-border p-4"
                    >
                      <Link
                        className="inline-flex min-h-11 items-center font-medium text-brand"
                        href={`/clubs/${encodeURIComponent(m.clubId)}`}
                      >
                        {clubs.items.find((c) => c.id === m.clubId)?.name ??
                          "Open club record"}
                      </Link>
                      <Badge
                        tone={
                          m.status === "approved"
                            ? "success"
                            : m.status === "pending"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {m.status}
                      </Badge>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">
                    No loaded membership decisions.
                  </li>
                )}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="font-display text-xl font-semibold">
              Your event plans
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              An RSVP is a plan, not proof of attendance, contribution or an
              institutional award.
            </p>
            {plans.error || events.error ? (
              <div role="alert">
                <p>{plans.error || events.error}</p>
                <Button
                  onClick={() => {
                    plans.refresh();
                    events.refresh();
                  }}
                >
                  Retry event plans
                </Button>
              </div>
            ) : plans.loading || events.loading ? (
              <p role="status" className="mt-4">
                Loading event plans…
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {plans.goingIds.length ? (
                  plans.goingIds.map((id) => (
                    <li key={id}>
                      <Link
                        className="inline-flex min-h-11 items-center text-brand"
                        href={`/events/${encodeURIComponent(id)}`}
                      >
                        {events.items.find((e) => e.id === id)?.title ??
                          "Open event record"}{" "}
                        →
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">
                    No loaded event plans. Discover something that interests
                    you.
                  </li>
                )}
              </ul>
            )}
            <Link
              href="/events"
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand"
            >
              Explore events →
            </Link>
          </Card>
        </div>
      )}
    </>
  );
}
