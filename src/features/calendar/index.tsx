import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui";
import { engagementService, productivityService } from "@/services";

export function CalendarFeature() {
  const sessions = productivityService.listTimetableSessions();
  const events = engagementService.listEvents();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendar"
        description="Unified view of classes, events, and personal study plans."
      />
      <Card>
        <h2 className="font-semibold">Week view (demo)</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-xl border border-[var(--color-border)] p-3 text-sm"
            >
              <p className="font-medium">
                {session.day} • {session.start} - {session.end}
              </p>
              <p className="text-muted-foreground">
                {session.course} at {session.venue}
              </p>
            </div>
          ))}
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-[var(--color-border)] p-3 text-sm"
            >
              <p className="font-medium">
                {event.date} • {event.title}
              </p>
              <p className="text-muted-foreground">{event.venue}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
