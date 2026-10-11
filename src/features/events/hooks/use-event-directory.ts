"use client";
import { useEffect, useRef, useState } from "react";
import { eventCatalogService, eventActionService } from "@/services";
import { eventDirectory, initialEventFilters } from "@/lib/events/directory";
import type { EventCatalog, EventFilters } from "@/types";
import type { EventActivityState } from "./use-event-activity";
export function useEventDirectory(initial: EventCatalog, activity: EventActivityState, now: Date) {
  const [catalog, setCatalog] = useState(initial),
    [more, setMore] = useState(false),
    [moreError, setMoreError] = useState(""),
    [filter, setFilter] = useState<EventFilters>(initialEventFilters);
  const resultsRef = useRef<HTMLHeadingElement>(null),
    request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const events = catalog.page?.items ?? [],
    categories = [...new Set(events.map((event) => event.category))].sort(),
    results = eventDirectory(events, filter, activity, now, eventActionService.source);
  const change = (value: Partial<EventFilters>) =>
    setFilter((current) => ({ ...current, ...value, page: value.page ?? 1 }));
  const reset = () => setFilter({ ...initialEventFilters });
  const loadMore = async () => {
    if (!catalog.page || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setMore(true);
    setMoreError("");
    try {
      const next = await eventCatalogService.list(catalog.page.page + 1, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (next.page)
        setCatalog({
          now: catalog.now,
          error: null,
          page: {
            ...next.page,
            items: [
              ...new Map(
                [...events, ...next.page.items].map((event) => [event.id, event]),
              ).values(),
            ],
          },
        });
      else setMoreError(next.error ?? "More events could not load.");
    } catch (error) {
      if (!controller.signal.aborted)
        setMoreError(error instanceof Error ? error.message : "More events could not load.");
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setMore(false);
      }
    }
  };
  return {
    catalog,
    more,
    moreError,
    filter,
    resultsRef,
    events,
    categories,
    results,
    change,
    reset,
    loadMore,
  };
}
export type EventDirectoryState = ReturnType<typeof useEventDirectory>;
