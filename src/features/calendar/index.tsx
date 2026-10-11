"use client";
import { useState } from "react";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { images } from "@/config/images";
import { Button, SegmentedControl } from "@/components/ui";
import { useWorkspace } from "@/features/workspace/hooks/use-workspace";
import {
  dateAdd,
  weekStart,
  weeklyAgenda,
  eventsAgenda,
  plansAgenda,
  sortAgenda,
  monthDays,
  monthShift,
} from "@/lib/schedule/agenda";
import { AgendaList } from "@/features/schedule/components/agenda-list";
import { ScheduleExport } from "@/features/schedule/components/export-button";
import { PlanEditor } from "@/features/schedule/components/plan-editor";
import { MonthGrid } from "./components/month-grid";
import type { ScheduleSnapshot } from "@/types/schedule";
export function CalendarFeature({ initial }: { initial: ScheduleSnapshot }) {
  const today = initial.now.slice(0, 10),
    [anchor, setAnchor] = useState(today),
    [selected, setSelected] = useState(today),
    [view, setView] = useState("week"),
    classes = useWorkspace("sessions"),
    plans = useWorkspace("plans"),
    dates =
      view === "month"
        ? monthDays(anchor)
        : Array.from({ length: 7 }, (_, n) => dateAdd(weekStart(anchor), n)),
    label =
      initial.source === "demo"
        ? "Demo class · not official"
        : "Catalog class · verify official schedule",
    all = sortAgenda([
      ...weeklyAgenda(initial.sessions, dates, label),
      ...weeklyAgenda(classes.items, dates, "Your personal class"),
      ...eventsAgenda(
        initial.events,
        initial.source === "demo"
          ? "Fictional public event · not an RSVP"
          : "Public event · not an RSVP",
      ),
      ...plansAgenda(plans.items),
    ]),
    rows = all.filter((i) =>
      view === "month"
        ? i.date.startsWith(anchor.slice(0, 7))
        : dates.includes(i.date),
    );
  return (
    <div className="space-y-6">
      <MagazineHeader
        eyebrow="Calendar"
        title="Make space for the good things."
        description="Classes, public events and your own plans — one calm place to see the week."
        image={images.eventSocial}
      />
      {initial.errors.map((e) => (
        <p
          key={e}
          role="alert"
          className="rounded-control bg-warning-soft p-4 text-sm"
        >
          {e}
        </p>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="Calendar view"
          value={view}
          onValueChange={setView}
          options={[
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
            { value: "agenda", label: "Agenda" },
          ]}
        />
        <Button
          variant="secondary"
          onClick={() => {
            const next =
              view === "month" ? monthShift(anchor, -1) : dateAdd(anchor, -7);
            setAnchor(next);
            setSelected(next);
          }}
        >
          Previous
        </Button>
        <Button variant="secondary" onClick={() => setAnchor(today)}>
          Today
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            const next =
              view === "month" ? monthShift(anchor, 1) : dateAdd(anchor, 7);
            setAnchor(next);
            setSelected(next);
          }}
        >
          Next
        </Button>
        <ScheduleExport items={rows} />
      </div>
      <h2 className="font-display text-2xl font-semibold">
        {view === "month" ? anchor.slice(0, 7) : `Week of ${weekStart(anchor)}`}
      </h2>
      <p className="text-xs text-muted-foreground">
        Africa/Accra time · Bounded loaded sources. Public events are not
        automatically your RSVPs. Source examples and personal plans are
        labelled separately.
      </p>
      {view === "month" ? (
        <>
          <MonthGrid
            anchor={anchor}
            selected={selected}
            today={today}
            items={all}
            onSelect={setSelected}
          />
          <h3 className="font-display text-xl font-semibold">{selected}</h3>
          <AgendaList items={all.filter((i) => i.date === selected)} />
        </>
      ) : (
        <AgendaList items={rows} />
      )}
      <PlanEditor initialDate={selected} />
    </div>
  );
}
