import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400",
        className,
      )}
      {...props}
    />
  );
}
