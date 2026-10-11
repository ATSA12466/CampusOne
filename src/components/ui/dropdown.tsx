"use client";

import * as Primitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cva } from "class-variance-authority";
import { useId, type ReactNode } from "react";
import type { DropdownItem } from "@/types/ui";

const item = cva(
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-3 py-2 text-sm outline-none data-[highlighted]:bg-surface-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
  {
    variants: { danger: { true: "text-danger", false: "text-foreground" } },
    defaultVariants: { danger: false },
  },
);
export function Dropdown({
  trigger,
  items,
  label,
  align = "end",
  defaultOpen,
}: {
  trigger: ReactNode;
  items: readonly DropdownItem[];
  label?: string;
  align?: "start" | "center" | "end";
  defaultOpen?: boolean;
}) {
  const labelId = useId();
  return (
    <Primitive.Root modal={false} defaultOpen={defaultOpen}>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          {...(label ? { "aria-labelledby": labelId } : {})}
          align={align}
          sideOffset={8}
          className="dialog-enter z-70 min-w-48 rounded-card border border-border bg-surface-raised p-1.5 text-foreground shadow-overlay"
        >
          {label ? (
            <>
              <Primitive.Label
                id={labelId}
                className="px-3 py-2 text-xs font-semibold text-muted-foreground"
              >
                {label}
              </Primitive.Label>
              <Primitive.Separator className="mb-1 h-px bg-border" />
            </>
          ) : null}
          {items.map((option) =>
            option.selected !== undefined ? (
              <Primitive.CheckboxItem
                key={option.label}
                checked={option.selected}
                disabled={option.disabled}
                onSelect={option.onSelect}
                className={item({ danger: option.danger })}
              >
                {option.icon}
                <span className="flex-1">{option.label}</span>
                <Primitive.ItemIndicator>
                  <Check className="size-4" aria-hidden="true" />
                </Primitive.ItemIndicator>
              </Primitive.CheckboxItem>
            ) : (
              <Primitive.Item
                key={option.label}
                disabled={option.disabled}
                onSelect={option.onSelect}
                className={item({ danger: option.danger })}
              >
                {option.icon}
                {option.label}
              </Primitive.Item>
            ),
          )}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
