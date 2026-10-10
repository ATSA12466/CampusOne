"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-royal-blue)] text-white hover:bg-[var(--color-bright-blue)]",
        secondary: "border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:bg-slate-50",
        ghost: "text-[var(--color-text-secondary)] hover:bg-slate-100",
        danger: "bg-[var(--color-error)] text-white hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: Props) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
