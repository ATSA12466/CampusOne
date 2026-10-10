"use client";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/features/search";
import { searchPreviewService } from "@/services";
import type { SearchPreviewMode } from "@/types/search";
const cases: readonly { mode: SearchPreviewMode; label: string }[] = [
  { mode: "default", label: "Open campus search" },
  { mode: "error", label: "Preview search error" },
  { mode: "partial", label: "Preview partial results" },
  { mode: "slow", label: "Preview slow search" },
];
export function SearchShowcase() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SearchPreviewMode>("default");
  const focus = useRef<HTMLElement | null>(null);
  const service = useMemo(() => searchPreviewService(mode), [mode]);
  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="font-display text-xl font-semibold">A shortcut to your campus.</h3>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Search states use a labelled development fixture. Error and partial-result previews recover
        on retry; slow replies exercise loading and stale-response protection. They do not prove
        live API connectivity.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {cases.map((item) => (
          <Button
            key={item.mode}
            variant="secondary"
            onClick={(event) => {
              focus.current = event.currentTarget;
              setMode(item.mode);
              setOpen(true);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <GlobalSearch
        key={mode}
        open={open}
        onOpenChange={setOpen}
        returnFocusRef={focus}
        service={service}
      />
    </div>
  );
}
