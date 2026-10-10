import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export const fieldVariants = cva("field-control px-3.5 py-2.5", {
  variants: { variant: { default: "", filled: "border-transparent bg-surface-muted" } },
  defaultVariants: { variant: "default" },
});
export function Input({
  className,
  variant,
  ...props
}: ComponentProps<"input"> & VariantProps<typeof fieldVariants>) {
  return <input className={cn(fieldVariants({ variant }), className)} {...props} />;
}
