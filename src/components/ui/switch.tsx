"use client";

import * as Primitive from "@radix-ui/react-switch";
import { cva } from "class-variance-authority";
import { useId, type ComponentProps } from "react";

const target = cva(
  "group relative inline-flex h-11 w-14 shrink-0 items-center rounded-control disabled:opacity-50",
);
export function Switch({
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
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor={fieldId}
          className="flex min-h-11 cursor-pointer items-center text-sm font-medium"
        >
          {label}
        </label>
        <Primitive.Root id={fieldId} className={target()} {...props}>
          <span className="block h-6 w-11 rounded-full bg-subtle-foreground transition-colors group-data-[state=checked]:bg-brand">
            <Primitive.Thumb className="block size-5 translate-x-0.5 translate-y-0.5 rounded-full bg-on-photo shadow-low transition-transform data-[state=checked]:translate-x-5" />
          </span>
        </Primitive.Root>
      </div>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}
