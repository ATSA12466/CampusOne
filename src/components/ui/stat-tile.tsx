import { cva } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils/cn";
import type { SemanticTone } from "@/types/ui";

const icon = cva("grid size-11 place-items-center rounded-control", {
  variants: {
    tone: {
      neutral: "bg-surface-muted text-muted-foreground",
      primary: "bg-brand-soft text-brand",
      success: "bg-success-soft text-success",
      warning: "bg-warning-soft text-warning",
      danger: "bg-danger-soft text-danger",
      gold: "bg-accent-soft text-warning",
    },
  },
  defaultVariants: { tone: "primary" },
});
export function StatTile({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  className,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: LucideIcon;
  tone?: SemanticTone;
  className?: string;
}) {
  return (
    <Card className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        {detail ? <p className="mt-2 text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      {Icon ? (
        <span className={icon({ tone })}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      ) : null}
    </Card>
  );
}
