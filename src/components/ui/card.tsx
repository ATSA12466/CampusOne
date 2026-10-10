import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

const variants = cva("min-w-0 rounded-card text-foreground", {
  variants: {
    variant: {
      default: "border border-border bg-surface shadow-low",
      raised: "border border-border bg-surface-raised shadow-raised",
      flat: "bg-surface-muted",
      outline: "border border-border bg-transparent",
    },
    padding: { none: "", sm: "p-4", md: "p-4 md:p-5", lg: "p-6 md:p-8" },
  },
  defaultVariants: { variant: "default", padding: "md" },
});
export function Card({
  className,
  variant,
  padding,
  ...props
}: ComponentProps<"section"> & VariantProps<typeof variants>) {
  return <section className={cn(variants({ variant, padding }), className)} {...props} />;
}
