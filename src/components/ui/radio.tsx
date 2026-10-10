"use client";

import * as Primitive from "@radix-ui/react-radio-group";
import { useId } from "react";
import { cva } from "class-variance-authority";
import type { ChoiceOption } from "@/types/ui";

const target = cva(
  "group grid size-11 shrink-0 place-items-center rounded-control disabled:opacity-50",
);
export function RadioGroup({
  label,
  options,
  value,
  onValueChange,
  name,
  disabled,
}: {
  label: string;
  options: readonly ChoiceOption[];
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <fieldset>
      <legend id={id} className="mb-2 text-sm font-semibold">
        {label}
      </legend>
      <Primitive.Root
        aria-labelledby={id}
        name={name}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        {options.map((option, index) => (
          <div key={option.value} className="flex items-center gap-1">
            <Primitive.Item
              id={`${id}-${index}`}
              value={option.value}
              aria-labelledby={`${id}-${index}-label`}
              aria-describedby={option.description ? `${id}-${index}-hint` : undefined}
              className={target()}
            >
              <span className="grid size-5 place-items-center rounded-full border border-control-border bg-surface group-data-[state=checked]:border-brand">
                <Primitive.Indicator className="size-2.5 rounded-full bg-brand" />
              </span>
            </Primitive.Item>
            <label
              htmlFor={`${id}-${index}`}
              className="flex min-h-11 flex-col justify-center text-sm"
            >
              <span id={`${id}-${index}-label`} className="font-medium">
                {option.label}
              </span>
              {option.description ? (
                <span id={`${id}-${index}-hint`} className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              ) : null}
            </label>
          </div>
        ))}
      </Primitive.Root>
    </fieldset>
  );
}
