import Link from "next/link";
import { Card } from "@/components/ui";
import type { Opportunity } from "@/types";

export function RecommendedContent({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <Card>
      <h3 className="text-base font-semibold">Recommended opportunities</h3>
      <div className="mt-3 space-y-2">
        {opportunities.slice(0, 3).map((item) => (
          <Link
            prefetch={false}
            href="/opportunities"
            key={item.id}
            className="block rounded-xl border border-[var(--color-border)] p-3 text-sm transition hover:bg-surface-muted"
          >
            <p className="font-medium text-foreground">{item.title}</p>
            <p className="text-muted-foreground">
              {item.provider} • Deadline {item.deadline}
            </p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
