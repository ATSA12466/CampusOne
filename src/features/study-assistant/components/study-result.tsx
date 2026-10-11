"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduleExport } from "@/features/schedule/components/export-button";
import type { StudyPlan } from "@/types/study-planner";
export function StudyResult({
  plan,
  busy,
  onSave,
  onRemove,
}: {
  plan: StudyPlan;
  busy: boolean;
  onSave?: () => Promise<void>;
  onRemove?: () => Promise<void>;
}) {
  const agenda = plan.sessions.map((s) => ({
    id: `${plan.id}-${s.date}`,
    date: s.date,
    start: s.start,
    end: s.end,
    title: `${plan.subject} · ${s.focus}`,
    venue: "Your chosen study space",
    kind: "personal" as const,
    label: "Private deterministic study draft; not AI or an official timetable",
  }));
  return (
    <Card className="space-y-5" data-study-plan={plan.id}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="break-words font-display text-2xl font-semibold">
          {plan.subject}
        </h3>
        <Badge tone="neutral">Personal draft</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {plan.sessions.length} sessions ·{" "}
        {Number(plan.duration) * plan.sessions.length} focused minutes ·{" "}
        {plan.breakMinutes}-minute breaks
      </p>
      <ol className="space-y-3">
        {plan.sessions.map((s) => (
          <li key={s.date} className="rounded-control border border-border p-4">
            <p className="font-semibold">
              {new Intl.DateTimeFormat("en-GH", {
                weekday: "long",
                day: "numeric",
                month: "short",
                timeZone: "Africa/Accra",
              }).format(new Date(`${s.date}T12:00:00Z`))}
            </p>
            <p className="mt-1 text-sm">
              {s.start}–{s.end} · {s.focus}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Break until {s.breakUntil} · Africa/Accra
            </p>
          </li>
        ))}
      </ol>
      {plan.constraints ? (
        <div className="rounded-control bg-surface-muted p-4">
          <p className="text-xs font-semibold">
            Your notes · context only, not interpreted
          </p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">
            {plan.constraints}
          </p>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Check these sessions against your real commitments. Export is a
        tentative personal calendar snapshot, not live sync, AI advice or an
        official class schedule.
      </p>
      <div className="flex flex-wrap gap-2">
        {onSave ? (
          <Button disabled={busy} onClick={() => void onSave().catch(() => {})}>
            Save study draft
          </Button>
        ) : null}
        <ScheduleExport items={agenda} />
        {onRemove ? (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => void onRemove().catch(() => {})}
          >
            Delete saved draft
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
