"use client";
import { useState, useRef } from "react";
import { ValidatedForm } from "@/components/shared/validated-form";
import { Button, Card, Dialog } from "@/components/ui";
import { useWorkspace } from "@/features/workspace/hooks/use-workspace";
import { planInputSchema } from "@/services/validation/schedule.schema";
import type { PersonalPlan } from "@/types/schedule";
export function PlanEditor({ initialDate }: { initialDate: string }) {
  const focusRef = useRef<HTMLButtonElement | null>(null);
  const w = useWorkspace("plans"),
    [edit, setEdit] = useState<PersonalPlan | null>(null),
    [remove, setRemove] = useState<string | null>(null);
  return (
    <section
      className="grid items-start gap-5 lg:grid-cols-2"
      aria-label="Personal plan editor"
    >
      <Card>
        <h2
          id="plan-editor-heading"
          tabIndex={-1}
          className="mb-4 font-display text-2xl font-semibold"
        >
          Leave a little time for you.
        </h2>
        <ValidatedForm
          key={w.owner + (edit?.id ?? "new")}
          schema={planInputSchema}
          fields={[
            { name: "title", label: "Plan title" },
            { name: "date", label: "Plan date", type: "date" },
            { name: "start", label: "Plan starts", type: "time" },
            { name: "end", label: "Plan ends", type: "time" },
            { name: "venue", label: "Plan location" },
          ]}
          initial={
            edit
              ? {
                  title: edit.title,
                  date: edit.date,
                  start: edit.start,
                  end: edit.end,
                  venue: edit.venue,
                }
              : { date: initialDate, start: "16:00", end: "17:00" }
          }
          submitLabel={edit ? "Update plan" : "Add personal plan"}
          disabled={!w.ready || w.busy}
          onSubmit={async (v) => {
            await w.put({ ...v, id: edit?.id ?? crypto.randomUUID() });
            setEdit(null);
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Private on this device in demo mode. No calendar invitation is sent.
        </p>
        {w.notice || w.error ? (
          <p role="status" className="mt-3 text-sm">
            {w.notice || w.error}
          </p>
        ) : null}
        {w.error ? (
          <Button variant="secondary" onClick={w.refresh}>
            Retry plans
          </Button>
        ) : null}
      </Card>
      <div className="space-y-3">
        {w.loading ? (
          <p role="status">Loading personal plans…</p>
        ) : (
          w.items.map((p) => (
            <Card key={p.id}>
              <p className="text-xs text-brand">
                {p.date} · {p.start}–{p.end}
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold">
                {p.title}
              </h3>
              <p className="mt-2 text-sm">{p.venue}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => setEdit(p)}>
                  Edit plan
                </Button>
                <Button
                  variant="ghost"
                  onClick={(event) => {
                    focusRef.current = event.currentTarget;
                    setRemove(p.id);
                  }}
                >
                  Delete plan
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
      <Dialog
        title="Remove this plan?"
        description="This deletes the private plan, not a public event."
        returnFocusRef={focusRef}
        fallbackFocusSelector="#plan-editor-heading"
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
          Confirm plan deletion
        </Button>
      </Dialog>
    </section>
  );
}
