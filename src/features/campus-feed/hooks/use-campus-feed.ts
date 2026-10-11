"use client";
import { useState, useEffect, useRef } from "react";
import { campusService } from "@/services";
import type { CampusFeed } from "@/types/campus-feed";
import type { CollectionName } from "@/types/service-contracts";
export function useCampusFeed<K extends CollectionName>(
  collection: K,
  initial: CampusFeed<K>,
) {
  const [feed, setFeed] = useState(initial),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState(""),
    [failedMore, setFailedMore] = useState(false),
    controller = useRef<AbortController | null>(null),
    page = useRef(1);
  useEffect(() => () => controller.current?.abort(), []);
  const load = async (more = false) => {
    if (controller.current) return;
    const c = new AbortController();
    controller.current = c;
    setBusy(true);
    setFailure("");
    const next = more ? page.current + 1 : 1;
    try {
      const result = await campusService.list(collection, {
        page: next,
        pageSize: 30,
        signal: AbortSignal.any([c.signal, AbortSignal.timeout(8000)]),
      });
      if (
        result.page !== next ||
        result.pageSize !== 30 ||
        !Number.isSafeInteger(result.total) ||
        result.total < result.items.length ||
        new Set(result.items.map((r) => r.id)).size !== result.items.length ||
        (!result.items.length && result.hasMore)
      )
        throw new Error("This source returned an inconsistent page.");
      if (!c.signal.aborted) {
        page.current = next;
        setFeed((old) => ({
          items: more
            ? [
                ...old.items,
                ...result.items.filter(
                  (r) => !old.items.some((i) => i.id === r.id),
                ),
              ]
            : result.items,
          total: result.total,
          hasMore: result.hasMore,
          error: null,
        }));
      }
    } catch (e) {
      if (!c.signal.aborted) {
        setFailedMore(more);
        setFailure(
          e instanceof Error ? e.message : "This source could not load.",
        );
      }
    } finally {
      if (!c.signal.aborted) setBusy(false);
      controller.current = null;
    }
  };
  return {
    ...feed,
    busy,
    failure,
    error: feed.error,
    load,
    retry: () => load(failedMore),
  };
}
