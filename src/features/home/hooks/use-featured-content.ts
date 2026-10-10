import { useMemo, useState } from "react";
import type { FeaturedContentItem } from "@/types";

export function useFeaturedContent(items: FeaturedContentItem[]) {
  const [index, setIndex] = useState(0);

  const normalizedIndex = useMemo(() => {
    if (!items.length) return 0;
    return Math.min(index, items.length - 1);
  }, [index, items.length]);

  const current = useMemo(() => items[normalizedIndex], [items, normalizedIndex]);

  const previous = () => {
    if (!items.length) return;
    setIndex((value) => (value === 0 ? items.length - 1 : value - 1));
  };

  const next = () => {
    if (!items.length) return;
    setIndex((value) => (value === items.length - 1 ? 0 : value + 1));
  };

  return {
    index: normalizedIndex,
    current,
    previous,
    next,
    setIndex,
  };
}
