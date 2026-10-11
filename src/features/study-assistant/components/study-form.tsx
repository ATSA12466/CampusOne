"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { studyInputSchema } from "@/services/validation/study.schema";
import { StudyTimeControls } from "./study-time-controls";
import { StudyAvailability } from "./study-availability";
import { nextStudyWeek } from "@/lib/study/planner";
import type { StudyPlannerInput } from "@/types/study-planner";
export function StudyForm({
  disabled,
  onGenerate,
}: {
  disabled: boolean;
  onGenerate: (input: StudyPlannerInput) => Promise<void>;
}) {
  const form = useForm<StudyPlannerInput>({
      resolver: zodResolver(studyInputSchema),
      defaultValues: {
        subject: "Software Engineering",
        weekStart: nextStudyWeek(),
        days: ["Monday", "Wednesday", "Friday"],
        start: "18:00",
        duration: "45",
        breakMinutes: "10",
        goal: "Mixed",
        constraints: "",
      },
    }),
    busy = disabled || form.formState.isSubmitting;
  const error = (name: keyof StudyPlannerInput) =>
    form.formState.errors[name]?.message;
  return (
    <Card className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold">
          A plan that fits your week.
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          A deterministic planning tool, not an AI model or official timetable.
          Availability, times, duration, focus and breaks use the controls
          below. Free-text notes are kept as context, not interpreted as
          scheduling rules.
        </p>
      </div>
      <form
        noValidate
        className="space-y-5"
        onSubmit={form.handleSubmit(onGenerate)}
        aria-busy={form.formState.isSubmitting}
      >
        <div>
          <label
            htmlFor="study-subject"
            className="mb-1.5 block text-sm font-medium"
          >
            Priority subject
          </label>
          <Input
            id="study-subject"
            maxLength={100}
            disabled={busy}
            aria-invalid={!!error("subject")}
            aria-describedby={
              error("subject") ? "study-subject-error" : undefined
            }
            {...form.register("subject")}
          />
          {error("subject") ? (
            <p
              id="study-subject-error"
              role="alert"
              className="mt-1 text-xs text-danger"
            >
              {error("subject")}
            </p>
          ) : null}
        </div>
        <StudyTimeControls form={form} busy={busy} />
        <StudyAvailability form={form} busy={busy} />
        <div>
          <label
            htmlFor="study-notes"
            className="mb-1.5 block text-sm font-medium"
          >
            Constraints and reminders
          </label>
          <Textarea
            id="study-notes"
            disabled={busy}
            rows={3}
            maxLength={1000}
            placeholder="Manual context: room preferences, revision topics, commitments to double-check…"
            {...form.register("constraints")}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            These notes appear verbatim on your draft. Set actual availability
            using the day/time controls.
          </p>
        </div>
        <Button type="submit" disabled={busy}>
          {form.formState.isSubmitting
            ? "Preparing draft…"
            : "Generate study draft"}
        </Button>
      </form>
    </Card>
  );
}
