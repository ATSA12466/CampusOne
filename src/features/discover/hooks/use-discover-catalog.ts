"use client";
import { useEffect, useRef, useState } from "react";
import { discoverCatalogService } from "@/services";
import { discoverKey } from "@/lib/discover/directory";
import type {
  DiscoverCategory,
  DiscoverSection,
  DiscoverSnapshot,
} from "@/types/discover";
export function useDiscoverCatalog(initial: DiscoverSnapshot) {
  const [sections, setSections] = useState(initial.sections),
    [pending, setPending] = useState<DiscoverCategory | null>(null),
    [failure, setFailure] = useState<{
      category: DiscoverCategory;
      message: string;
      more: boolean;
    } | null>(null),
    request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const read = async (category: DiscoverCategory, more = false) => {
    if (request.current) return;
    const current = sections.find((section) => section.category === category),
      controller = new AbortController();
    if (more && !current?.page?.hasMore) return;
    request.current = controller;
    setPending(category);
    setFailure(null);
    try {
      const next = await discoverCatalogService.section(
        category,
        more && current?.page ? current.page.page + 1 : 1,
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      if (next.page) {
        const updated: DiscoverSection = {
          ...next,
          page: {
            ...next.page,
            items: more
              ? [
                  ...new Map(
                    [...(current?.page?.items ?? []), ...next.page.items].map(
                      (item) => [discoverKey(item), item],
                    ),
                  ).values(),
                ]
              : next.page.items,
          },
        };
        setSections((previous) =>
          previous.map((section) =>
            section.category === category ? updated : section,
          ),
        );
      } else if (more || current?.page)
        setFailure({
          category,
          more,
          message: next.error ?? "More listings could not load. Please retry.",
        });
      else
        setSections((previous) =>
          previous.map((section) =>
            section.category === category ? next : section,
          ),
        );
    } catch (cause) {
      if (!controller.signal.aborted)
        setFailure({
          category,
          more,
          message:
            cause instanceof Error
              ? cause.message
              : "This campus source could not load. Please retry.",
        });
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setPending(null);
      }
    }
  };
  return { sections, pending, failure, read };
}
