import { Check, Circle } from "lucide-react";
import { cva } from "class-variance-authority";
import type { TimelineEntry } from "@/types/ui";

const marker = cva(
  "relative z-10 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border",
  {
    variants: {
      status: {
        complete: "border-brand bg-brand text-on-brand",
        current: "border-brand bg-brand-soft text-brand",
        upcoming: "border-border bg-surface text-muted-foreground",
      },
    },
    defaultVariants: { status: "upcoming" },
  },
);
export function Timeline({ label, items }: { label: string; items: readonly TimelineEntry[] }) {
  return (
    <ol aria-label={label} className="space-y-6">
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-4">
          {index < items.length - 1 ? (
            <span
              className="absolute top-7 bottom-[-1.5rem] left-3.5 w-px bg-border"
              aria-hidden="true"
            />
          ) : null}
          <span className={marker({ status: item.status })} aria-hidden="true">
            {item.status === "complete" ? (
              <Check className="size-3.5" />
            ) : (
              <Circle className="size-2 fill-current" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{item.title}</p>
            {item.description ? (
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            ) : null}
            {item.date ? (
              <time dateTime={item.date} className="mt-2 block text-[11px] text-muted-foreground">
                {new Intl.DateTimeFormat("en-GH", {
                  month: "short",
                  day: "numeric",
                  timeZone: "Africa/Accra",
                }).format(new Date(item.date))}
              </time>
            ) : null}
            <span className="sr-only">{item.status ?? "upcoming"}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
