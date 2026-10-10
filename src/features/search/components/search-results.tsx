import { ArrowUpRight, Search } from "lucide-react";
import { navIcons } from "@/components/navigation/nav-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils/cn";
import type { SearchResult } from "@/types/search";
export function SearchResults({
  items,
  active,
  listId,
  pending,
  query,
  onActive,
  onNavigate,
}: {
  items: readonly SearchResult[];
  active: number;
  listId: string;
  pending: boolean;
  query: string;
  onActive: (index: number) => void;
  onNavigate: (item: SearchResult) => void;
}) {
  return (
    <div
      id={listId}
      role={pending || !items.length ? "region" : "listbox"}
      aria-label="Campus search results"
      aria-busy={pending}
      className="max-h-[42dvh] min-h-36 space-y-1 overflow-y-auto overscroll-contain p-1"
    >
      {pending ? (
        <div role="status" className="space-y-4 p-3">
          <span className="sr-only">Finding your campus…</span>
          {[0, 1, 2].map((index) => (
            <div key={index} aria-hidden="true" className="flex gap-3">
              <Skeleton shape="circle" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-2/3" />
                <Skeleton className="w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length ? (
        items.map((item, index) => {
          const Icon = navIcons[item.icon];
          return (
            <button
              key={item.id}
              id={`${listId}-${index}`}
              type="button"
              role="option"
              aria-selected={active === index}
              aria-label={`${item.title}, ${item.group}`}
              tabIndex={-1}
              onMouseMove={() => onActive(index)}
              onClick={() => onNavigate(item)}
              className={cn(
                "flex min-h-16 w-full items-center gap-3 rounded-control p-3 text-left transition-colors",
                active === index
                  ? "bg-brand-soft text-brand"
                  : "text-foreground hover:bg-surface-muted",
              )}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-control border border-border bg-surface">
                <Icon className="size-5 text-brand" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{item.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.description}
                </span>
                <span className="mt-1 block text-[10px] font-medium text-muted-foreground">
                  {item.group}
                </span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          );
        })
      ) : (
        <div role="presentation">
          <EmptyState
            icon={Search}
            title={query.length < 2 ? "A little more to go on." : "Nothing here, yet."}
            description={
              query.length < 2
                ? "Type at least two characters to find campus content."
                : "Try a shorter phrase or another category. Page shortcuts can help you explore."
            }
            className="border-0"
          />
        </div>
      )}
    </div>
  );
}
