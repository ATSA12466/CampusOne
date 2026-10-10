import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
        className,
      )}
      {...props}
    />
  );
}
