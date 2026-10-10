import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const variants = cva(
  "flex min-h-24 min-w-11 flex-col items-start gap-2 rounded-control border p-2 text-left transition-colors",
  {
    variants: {
      selected: {
        true: "border-brand bg-brand-soft",
        false: "border-border bg-surface hover:bg-surface-muted",
      },
    },
    defaultVariants: { selected: false },
  },
);
export function CalendarCell({
  date,
  selected = false,
  today = false,
  events = [],
  onSelect,
  className,
}: {
  date: string;
  selected?: boolean;
  today?: boolean;
  events?: readonly string[];
  onSelect?: () => void;
  className?: string;
}) {
  const day = new Date(`${date}T12:00:00Z`);
  const name = new Intl.DateTimeFormat("en-GH", {
    dateStyle: "full",
    timeZone: "Africa/Accra",
  }).format(day);
  return (
    <button
      type="button"
      aria-label={`${name}${today ? ", today" : ""}${events.length ? `, ${events.length} activities` : ""}`}
      aria-pressed={selected}
      aria-current={today ? "date" : undefined}
      className={cn(variants({ selected }), className)}
      onClick={onSelect}
    >
      <span
        className={cn(
          "grid size-7 place-items-center rounded-full text-xs font-semibold",
          today ? "bg-brand text-on-brand" : "text-foreground",
        )}
      >
        {day.getUTCDate()}
      </span>
      {events.slice(0, 2).map((event) => (
        <span
          key={event}
          className="w-full truncate rounded-md bg-brand-soft px-1 py-0.5 text-[10px] font-medium text-brand"
        >
          {event}
        </span>
      ))}
      {events.length > 2 ? (
        <span className="text-[10px] text-muted-foreground">+{events.length - 2} more</span>
      ) : null}
    </button>
  );
}
