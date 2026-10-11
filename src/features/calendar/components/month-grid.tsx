import { CalendarCell } from "@/components/ui/calendar-cell";
import { days, monthDays } from "@/lib/schedule/agenda";
import type { AgendaItem } from "@/types/schedule";
export function MonthGrid({
  anchor,
  selected,
  today,
  items,
  onSelect,
}: {
  anchor: string;
  selected: string;
  today: string;
  items: AgendaItem[];
  onSelect: (date: string) => void;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-0.5 sm:p-2">
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {days.map((d) => (
          <span key={d} className="py-2">
            {d.slice(0, 3)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {monthDays(anchor).map((date) => (
          <CalendarCell
            key={date}
            date={date}
            selected={date === selected}
            today={date === today}
            events={items.filter((i) => i.date === date).map((i) => i.title)}
            onSelect={() => onSelect(date)}
            className="min-h-24 min-w-0 px-1"
          />
        ))}
      </div>
    </div>
  );
}
