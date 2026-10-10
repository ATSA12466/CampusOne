"use client";
import { useId, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { SearchControls } from "./components/search-controls";
import { useCampusSearch } from "./hooks/use-campus-search";
import { SearchResults } from "./components/search-results";
import { SearchStatus } from "./components/search-status";
import type { SearchResult, SearchScope, SearchService } from "@/types/search";

export function GlobalSearch({
  open,
  onOpenChange,
  returnFocusRef,
  service,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  service?: SearchService;
}) {
  const router = useRouter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [active, setActive] = useState(0);
  const result = useCampusSearch(query, scope, open, service);
  const listId = `${id}-results`;
  const activeIndex = Math.min(active, Math.max(0, result.data.items.length - 1));
  const navigate = (item: SearchResult) => {
    onOpenChange(false);
    router.push(item.href);
  };
  const keys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || result.pending || !result.data.items.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const index =
        (activeIndex + (event.key === "ArrowDown" ? 1 : -1) + result.data.items.length) %
        result.data.items.length;
      setActive(index);
      document.getElementById(`${listId}-${index}`)?.scrollIntoView({ block: "nearest" });
    }
    if (event.key === "Enter") {
      event.preventDefault();
      navigate(result.data.items[activeIndex]);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      returnFocusRef={returnFocusRef}
      title="Search campus"
      description="Find a club, event, room or resource — or move to any page."
      className="max-w-2xl"
    >
      <SearchControls
        id={id}
        query={query}
        scope={scope}
        inputRef={input}
        listId={listId}
        open={open}
        activeOption={
          !result.pending && result.data.items.length ? `${listId}-${activeIndex}` : undefined
        }
        onQuery={(value) => {
          setQuery(value);
          setActive(0);
        }}
        onScope={(value) => {
          setScope(value);
          setActive(0);
        }}
        onKeyDown={keys}
      />
      <SearchStatus
        count={result.pending ? 0 : result.data.items.length}
        pending={result.pending}
        error={result.error}
        unavailable={result.pending ? [] : result.data.unavailable}
        hasMore={result.data.hasMore}
        onRetry={result.retry}
      />
      <SearchResults
        items={result.data.items}
        active={activeIndex}
        listId={listId}
        pending={result.pending}
        query={query}
        onActive={setActive}
        onNavigate={navigate}
      />
      <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
        <span>↑ ↓ to browse · Enter to open · Esc to close</span>
        <span>CampusOne · catalog search</span>
      </div>
    </Dialog>
  );
}
