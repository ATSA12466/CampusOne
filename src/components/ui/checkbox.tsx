"use client";

import * as Primitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cva } from "class-variance-authority";
import { useId, type ComponentProps } from "react";

const target = cva(
  "group grid size-11 shrink-0 place-items-center rounded-control disabled:opacity-50",
);
export function Checkbox({
  label,
  description,
  id,
  className,
  ...props
}: ComponentProps<typeof Primitive.Root> & { label: string; description?: string }) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        <Primitive.Root
          id={fieldId}
          className={target()}
          {...props}
          aria-describedby={
            [props["aria-describedby"], description ? `${fieldId}-hint` : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          }
        >
          <span className="grid size-5 place-items-center rounded-md border border-control-border bg-surface group-data-[state=checked]:border-brand group-data-[state=checked]:bg-brand group-data-[state=indeterminate]:bg-brand">
            <Primitive.Indicator className="text-on-brand">
              <Minus
                className="hidden size-4 group-data-[state=indeterminate]:block"
                aria-hidden="true"
              />
              <Check
                className="size-4 group-data-[state=indeterminate]:hidden"
                aria-hidden="true"
              />
            </Primitive.Indicator>
          </span>
        </Primitive.Root>
        <label
          htmlFor={fieldId}
          className="flex min-h-11 cursor-pointer items-center text-sm font-medium"
        >
          {label}
        </label>
      </div>
      {description ? (
        <p id={`${fieldId}-hint`} className="ml-12 text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
