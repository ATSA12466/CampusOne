import { Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Sparkles,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-media border border-dashed border-border bg-surface px-6 py-8 text-center",
        className,
      )}
    >
      <div className="relative mx-auto mb-5 grid size-16 place-items-center">
        <span
          className="absolute inset-0 rotate-12 rounded-card bg-accent-soft"
          aria-hidden="true"
        />
        <span className="relative grid size-14 place-items-center rounded-card border border-border bg-surface text-brand">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      </div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
