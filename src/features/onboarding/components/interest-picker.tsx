"use client";
import { Controller, type Control } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { campusInterests } from "@/config/onboarding";
import type { ProfileSetupValues } from "../validation/profile.schema";
export function InterestPicker({ control }: { control: Control<ProfileSetupValues> }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">
        What are you curious about?{" "}
        <span className="font-normal text-muted-foreground">(optional)</span>
      </legend>
      <Controller
        name="interests"
        control={control}
        render={({ field }) => (
          <div className="grid gap-1 sm:grid-cols-2">
            {campusInterests.map((interest) => (
              <Checkbox
                key={interest}
                label={interest}
                checked={field.value.includes(interest)}
                onCheckedChange={(checked) =>
                  field.onChange(
                    checked
                      ? [...field.value, interest]
                      : field.value.filter((item) => item !== interest),
                  )
                }
              />
            ))}
          </div>
        )}
      />
      <p className="mt-2 text-[11px] text-muted-foreground">
        These preferences are stored for future features; recommendations are not personalized yet.
      </p>
    </fieldset>
  );
}
