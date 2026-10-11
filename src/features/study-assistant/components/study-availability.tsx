"use client";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { weekDays } from "@/services/validation/schedule.schema";
import type { StudyPlannerInput } from "@/types/study-planner";
export function StudyAvailability({
  form,
  busy,
}: {
  form: UseFormReturn<StudyPlannerInput>;
  busy: boolean;
}) {
  const selected = useWatch({ control: form.control, name: "days" }),
    error = (name: keyof StudyPlannerInput) =>
      form.formState.errors[name]?.message;
  return (
    <fieldset aria-describedby="study-days-hint">
      <legend className="mb-2 text-sm font-medium">Available days</legend>
      <div className="grid gap-x-4 sm:grid-cols-2">
        {weekDays.map((day) => (
          <Checkbox
            key={day}
            label={day}
            checked={selected.includes(day)}
            disabled={busy}
            onCheckedChange={(checked) =>
              form.setValue(
                "days",
                checked
                  ? [...selected, day]
                  : selected.filter((d) => d !== day),
                { shouldValidate: true },
              )
            }
          />
        ))}
      </div>
      <p id="study-days-hint" className="mt-2 text-xs text-muted-foreground">
        One focused session per chosen day within this seven-day window.
      </p>
      {error("days") ? (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error("days")}
        </p>
      ) : null}
    </fieldset>
  );
}
