import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { eventDate, eventTime } from "@/lib/events/schedule";
import { eventPrice } from "@/lib/events/media";
import type { EventItem } from "@/types";
export function EventFacts({ event }: { event: EventItem }) {
  return (
    <dl className="grid gap-3 rounded-media border border-border bg-surface p-5 sm:grid-cols-3">
      {[
        { title: "When", label: eventDate(event), extra: eventTime(event), Icon: CalendarDays },
        { title: "Where", label: event.venue, extra: "Campus time: Africa/Accra", Icon: MapPin },
        {
          title: "Entry",
          label: eventPrice(event),
          extra: "No payment collected here",
          Icon: Ticket,
        },
      ].map(({ title, label, extra, Icon }) => (
        <div key={title} className="relative min-w-0 pl-14">
          <dt className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            <span
              className="absolute top-0 left-0 grid size-11 place-items-center rounded-control bg-brand-soft text-brand"
              aria-hidden="true"
            >
              <Icon className="size-5" />
            </span>
            {title}
          </dt>
          <dd className="mt-1 text-sm font-semibold">
            <span>{label}</span>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">{extra}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
