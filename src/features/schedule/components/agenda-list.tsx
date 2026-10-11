import Link from "next/link";
import { Card } from "@/components/ui";
import type { AgendaItem } from "@/types/schedule";
export function AgendaList({ items }: { items: AgendaItem[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {!items.length ? (
        <Card>
          <p className="text-sm text-muted-foreground">
            A little breathing room. No loaded activities in this view.
          </p>
        </Card>
      ) : (
        items.map((item) => (
          <Card key={item.kind + item.id}>
            <p className="text-xs text-brand">
              {item.date} ·{" "}
              {item.start
                ? `${item.start}–${item.end}`
                : "All day / time not supplied"}
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.venue}</p>
            <p className="mt-2 text-xs text-muted-foreground">{item.label}</p>
            {item.href ? (
              <Link
                href={item.href}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brand"
              >
                View event →
              </Link>
            ) : null}
          </Card>
        ))
      )}
    </div>
  );
}
