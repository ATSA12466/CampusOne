"use client";

import type { ReactNode } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils/cn";

export function InfiniteList<T>({
  items,
  renderItem,
  getKey,
  hasMore,
  loading,
  onLoadMore,
  empty,
  label,
  className,
}: {
  items: readonly T[];
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
  hasMore: boolean;
  loading?: boolean;
  onLoadMore: () => void;
  empty: ReactNode;
  label: string;
  className?: string;
}) {
  if (!items.length && !loading) return <>{empty}</>;
  return (
    <section aria-label={label} aria-busy={loading}>
      <ul className={cn("grid list-none gap-4", className)}>
        {items.map((item) => (
          <li key={getKey(item)} className="min-w-0">
            {renderItem(item)}
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div className="mt-6 text-center">
          <Button variant="secondary" disabled={loading} onClick={onLoadMore}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
      <p className="sr-only" role="status">
        {loading ? "Loading more results" : `${items.length} items shown`}
      </p>
    </section>
  );
}
