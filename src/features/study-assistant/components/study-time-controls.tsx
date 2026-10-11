"use client";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { StudyPlannerInput } from "@/types/study-planner";
export function StudyTimeControls({
  form,
  busy,
}: {
  form: UseFormReturn<StudyPlannerInput>;
  busy: boolean;
}) {
  const error = (name: keyof StudyPlannerInput) =>
    form.formState.errors[name]?.message;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="study-week"
            className="mb-1.5 block text-sm font-medium"
          >
            Week starting
          </label>
          <Input
            id="study-week"
            type="date"
            disabled={busy}
            {...form.register("weekStart")}
          />
          {error("weekStart") ? (
            <p role="alert" className="mt-1 text-xs text-danger">
              {error("weekStart")}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="study-time"
            className="mb-1.5 block text-sm font-medium"
          >
            Session start time
          </label>
          <Input
            id="study-time"
            type="time"
            disabled={busy}
            aria-invalid={!!error("start")}
            aria-describedby="study-time-hint"
            {...form.register("start")}
          />
          <p
            id="study-time-hint"
            className="mt-1 text-xs text-muted-foreground"
          >
            Africa/Accra · GMT, no daylight-saving change.
          </p>
          {error("start") ? (
            <p role="alert" className="mt-1 text-xs text-danger">
              {error("start")}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="study-duration"
            className="mb-1.5 block text-sm font-medium"
          >
            Preferred session duration
          </label>
          <Select
            id="study-duration"
            disabled={busy}
            {...form.register("duration")}
          >
            {["45", "60", "90"].map((v) => (
              <option key={v} value={v}>
                {v} minutes
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            htmlFor="study-break"
            className="mb-1.5 block text-sm font-medium"
          >
            Break after each session
          </label>
          <Select
            id="study-break"
            disabled={busy}
            {...form.register("breakMinutes")}
          >
            {["5", "10", "15"].map((v) => (
              <option key={v} value={v}>
                {v} minutes
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            htmlFor="study-goal"
            className="mb-1.5 block text-sm font-medium"
          >
            Session focus
          </label>
          <Select id="study-goal" disabled={busy} {...form.register("goal")}>
            <option>Revision</option>
            <option>Practice</option>
            <option>Mixed</option>
          </Select>
        </div>
      </div>
    </>
  );
}
