"use client";
import { useState } from "react";
import { useWorkspace } from "@/features/workspace/hooks/use-workspace";
import { ValidatedForm } from "@/components/shared/validated-form";
import { gradeInputSchema } from "@/services/validation/workspace.schema";
import { weightedGpa } from "@/lib/academics/gpa";
import { Card, Button, Select } from "@/components/ui";
export function GpaCalculator() {
  const w = useWorkspace("grades"),
    [term, setTerm] = useState("all"),
    rows = w.items.filter((e) => term === "all" || e.term === term),
    result = weightedGpa(rows);
  return (
    <section
      className="grid items-start gap-5 lg:grid-cols-2"
      aria-label="GPA calculator"
    >
      <Card>
        <h2 className="font-display text-2xl font-semibold">
          See the bigger picture.
        </h2>
        <p className="my-4 text-xs text-muted-foreground">
          Personal planning estimate on a 0–4 point scale, not an official GCTU
          transcript or verified institutional grading policy. Enter your actual
          credit weights and grade points.
        </p>
        <ValidatedForm
          key={w.owner}
          schema={gradeInputSchema}
          fields={[
            { name: "course", label: "Course code" },
            { name: "term", label: "Semester" },
            { name: "credits", label: "Credits", type: "number" },
            { name: "points", label: "Grade points (0–4)", type: "number" },
          ]}
          initial={{ term: "Semester 1", credits: "3", points: "4" }}
          submitLabel="Add grade"
          disabled={!w.ready || w.busy}
          onSubmit={async (data) => w.put({ ...data, id: crypto.randomUUID() })}
        />
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
      <Card>
        <label className="text-sm font-medium">
          Calculate for
          <Select value={term} onChange={(e) => setTerm(e.target.value)}>
            <option value="all">All semesters</option>
            {[...new Set(w.items.map((e) => e.term))].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
        </label>
        <p role="status" className="mt-6 font-display text-4xl font-semibold">
          Estimated GPA: {result.gpa === null ? "—" : result.gpa.toFixed(2)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {result.credits} credits · weighted by credits
        </p>
        <ul className="mt-5 divide-y divide-border">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <span>
                {row.course} · {row.credits} credits · {row.points} points
              </span>
              <Button
                variant="ghost"
                disabled={w.busy}
                onClick={() => void w.remove(row.id).catch(() => {})}
                aria-label={`Remove ${row.course} grade`}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
