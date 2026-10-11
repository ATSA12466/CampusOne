"use client";
import { useState, useRef } from "react";
import { ValidatedForm } from "@/components/shared/validated-form";
import { Button, Card, Dialog } from "@/components/ui";
import { useWorkspace } from "@/features/workspace/hooks/use-workspace";
import {
  sessionInputSchema,
  weekDays,
} from "@/services/validation/schedule.schema";
import { classConflicts } from "@/lib/schedule/agenda";
import type { TimetableSession } from "@/types";
export function ClassEditor() {
  const focusRef = useRef<HTMLButtonElement | null>(null);
  const w = useWorkspace("sessions"),
    [edit, setEdit] = useState<TimetableSession | null>(null),
    [remove, setRemove] = useState<string | null>(null),
    conflicts = classConflicts(w.items);
  return (
    <section
      className="grid items-start gap-5 lg:grid-cols-2"
      aria-label="My timetable editor"
    >
      <Card>
        <h2
          id="class-editor-heading"
          tabIndex={-1}
          className="mb-4 font-display text-2xl font-semibold"
        >
          Make it your timetable.
        </h2>
        <ValidatedForm
          key={w.owner + (edit?.id ?? "new")}
          schema={sessionInputSchema}
          fields={[
            { name: "course", label: "Class / course" },
            {
              name: "day",
              label: "Class day",
              type: "select",
              options: weekDays,
            },
            { name: "start", label: "Class starts", type: "time" },
            { name: "end", label: "Class ends", type: "time" },
            { name: "venue", label: "Class venue" },
          ]}
          initial={
            edit
              ? {
                  course: edit.course,
                  day: edit.day,
                  start: edit.start,
                  end: edit.end,
                  venue: edit.venue,
                }
              : { day: "Monday", start: "09:00", end: "10:00" }
          }
          submitLabel={edit ? "Update class" : "Add class"}
          disabled={!w.ready || w.busy}
          onSubmit={async (v) => {
            await w.put({ ...v, id: edit?.id ?? crypto.randomUUID() });
            setEdit(null);
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Personal device schedule, separate from the source examples and
          official institutional registration.
        </p>
        {w.notice || w.error ? (
          <p role="status" className="mt-3 text-sm">
            {w.notice || w.error}
          </p>
        ) : null}
        {w.error ? (
          <Button variant="secondary" onClick={w.refresh}>
            Retry classes
          </Button>
        ) : null}
      </Card>
      <div className="space-y-3">
        {conflicts.length ? (
          <p
            role="alert"
            className="rounded-control bg-warning-soft p-4 text-sm text-warning-foreground"
          >
            {conflicts.length} overlapping personal class pair(s). Edit the
            times to resolve them.
          </p>
        ) : null}
        {w.loading ? (
          <p role="status">Loading your classes…</p>
        ) : (
          w.items.map((c) => (
            <Card key={c.id}>
              <p className="text-xs text-brand">
                {c.day} · {c.start}–{c.end}
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold">
                {c.course}
              </h3>
              <p className="mt-2 text-sm">{c.venue}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => setEdit(c)}>
                  Edit class
                </Button>
                <Button
                  variant="ghost"
                  onClick={(event) => {
                    focusRef.current = event.currentTarget;
                    setRemove(c.id);
                  }}
                >
                  Delete class
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
      <Dialog
        title="Remove this class?"
        description="Only your personal schedule is changed."
        returnFocusRef={focusRef}
        fallbackFocusSelector="#class-editor-heading"
        open={!!remove}
        onOpenChange={(v) => !v && setRemove(null)}
      >
        <Button
          disabled={w.busy}
          onClick={() =>
            void w
              .remove(remove!)
              .then(() => setRemove(null))
              .catch(() => {})
          }
        >
          Confirm class deletion
        </Button>
      </Dialog>
    </section>
  );
}
