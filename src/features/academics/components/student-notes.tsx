"use client";
import { useState } from "react";
import { useWorkspace } from "@/features/workspace/hooks/use-workspace";
import { ValidatedForm } from "@/components/shared/validated-form";
import { Card, Button } from "@/components/ui";
import { noteInputSchema } from "@/services/validation/workspace.schema";
import type { StudyNote } from "@/types/academic-tools";
export function StudentNotes() {
  const w = useWorkspace("notes"),
    [edit, setEdit] = useState<StudyNote | null>(null);
  return (
    <section
      className="grid items-start gap-5 lg:grid-cols-2"
      aria-label="Your study notes"
    >
      <Card>
        <h2 className="mb-4 font-display text-2xl font-semibold">
          A thought worth keeping.
        </h2>
        <ValidatedForm
          key={w.owner + (edit?.id ?? "new")}
          schema={noteInputSchema}
          fields={[
            { name: "course", label: "Course / subject" },
            { name: "title", label: "Note title" },
            {
              name: "body",
              label: "Your notes",
              type: "textarea",
              maxLength: 10000,
            },
          ]}
          initial={
            edit
              ? { course: edit.course, title: edit.title, body: edit.body }
              : {}
          }
          submitLabel={edit ? "Update note" : "Save note"}
          disabled={!w.ready || w.busy}
          onSubmit={async (data) => {
            await w.put({
              ...data,
              id: edit?.id ?? crypto.randomUUID(),
              createdAt: edit?.createdAt ?? new Date().toISOString(),
            });
            setEdit(null);
          }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Your current profile&rsquo;s private device notes; not official course
          material.
        </p>
        {w.error ? (
          <Button variant="secondary" onClick={w.refresh}>
            Retry workspace
          </Button>
        ) : null}
        {w.notice || w.error ? (
          <p role="status" className="mt-3 text-sm">
            {w.notice || w.error}
          </p>
        ) : null}
      </Card>
      <div className="space-y-3">
        {w.loading ? (
          <p role="status">Loading notes…</p>
        ) : (
          w.items.map((note) => (
            <Card key={note.id}>
              <p className="text-xs text-brand">{note.course}</p>
              <h3 className="mt-1 font-display text-xl font-semibold">
                {note.title}
              </h3>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm">
                {note.body}
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => setEdit(note)}>
                  Edit note
                </Button>
                <Button
                  variant="ghost"
                  disabled={w.busy}
                  onClick={() => void w.remove(note.id).catch(() => {})}
                >
                  Delete note
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
