import { CalendarDays, MapPin, Wallet } from "lucide-react";
import type { Club } from "@/types";
import { clubFee } from "@/lib/clubs/media";
export function ClubFacts({ club, compact = false }: { club: Club; compact?: boolean }) {
  const facts = [
    { icon: CalendarDays, label: "Meetup", value: club.details?.meeting ?? "Time not supplied" },
    { icon: MapPin, label: "Where", value: club.details?.venue ?? "Venue not supplied" },
    { icon: Wallet, label: "Joining", value: clubFee(club) },
  ];
  return (
    <dl
      className={
        compact
          ? "space-y-2"
          : "grid gap-4 rounded-card border border-border bg-surface p-5 sm:grid-cols-3"
      }
    >
      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label} className="min-w-0">
          <dt
            className={
              compact
                ? "sr-only"
                : "flex items-center gap-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
            }
          >
            {!compact ? <Icon className="size-4 text-brand" aria-hidden="true" /> : null}
            {label}
          </dt>
          <dd
            className={
              compact
                ? "flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground"
                : "mt-2 text-sm font-semibold"
            }
          >
            {compact ? (
              <Icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
            ) : null}
            <span>{value}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
