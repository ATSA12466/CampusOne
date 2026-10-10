import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { fieldVariants } from "./input";

export function Textarea({ className, rows = 3, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(fieldVariants(), "min-h-24 resize-y", className)}
      {...props}
    />
  );
}
