import { DiscoverCard } from "@/features/discover/components/discover-card";
import { discoverKey } from "@/lib/discover/directory";
import type { DiscoverItem } from "@/types/discover";
import type { DiscoverSaveState } from "@/features/discover/hooks/use-discover-save";
import type { DiscoverActivityState } from "@/features/discover/hooks/use-discover-activity";
export function ListingGrid({
  items,
  action,
  activity,
  user,
  now,
}: {
  items: DiscoverItem[];
  action: DiscoverSaveState;
  activity: DiscoverActivityState;
  user: boolean;
  now: Date;
}) {
  const result = { items },
    saved = new Set(activity.saved.map(discoverKey));
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {result.items.map((item) => {
        const key = discoverKey(item),
          busy = action.busy?.key === key,
          goal = busy ? action.busy!.goal : saved.has(key);
        return (
          <DiscoverCard
            key={key}
            item={item}
            now={now}
            saved={goal}
            pending={busy}
            disabled={!!action.busy}
            ready={!!user && !activity.loading && !activity.error}
            onSave={() => void action.save(item, !goal)}
          />
        );
      })}
    </div>
  );
}
