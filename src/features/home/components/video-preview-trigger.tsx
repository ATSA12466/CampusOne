"use client";
import { Play, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FeaturedContentItem } from "@/types/home";
type Player = typeof import("./video-preview-dialog").VideoPreviewDialog;
export function VideoPreviewTrigger({ item }: { item: FeaturedContentItem }) {
  const [PlayerComponent, setPlayer] = useState<Player | null>(null);
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false),
    [failed, setFailed] = useState(false);
  const wanted = useRef(false),
    trigger = useRef<HTMLButtonElement | null>(null);
  const launch = () => {
    wanted.current = true;
    if (PlayerComponent) {
      setOpen(true);
      return;
    }
    setPending(true);
    setFailed(false);
    void import("./video-preview-dialog")
      .then((module) => {
        setPlayer(() => module.VideoPreviewDialog);
        setPending(false);
        if (wanted.current) setOpen(true);
      })
      .catch(() => {
        setPending(false);
        if (wanted.current) setFailed(true);
      });
  };
  useEffect(() => {
    if (!pending) return;
    const cancel = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        wanted.current = false;
        setPending(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", cancel);
    return () => document.removeEventListener("keydown", cancel);
  }, [pending]);
  return (
    <>
      <Button
        ref={trigger}
        size="sm"
        variant="secondary"
        onClick={launch}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-busy={pending || undefined}
      >
        {pending ? (
          <LoaderCircle
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : (
          <Play className="size-4" aria-hidden="true" />
        )}
        {pending ? "Opening preview…" : (item.ctaLabel ?? "Watch preview")}
      </Button>
      {failed ? (
        <span role="alert" className="rounded-control bg-danger-soft px-3 text-xs text-danger">
          The player couldn&apos;t load. Save changes, then{" "}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-11 rounded-control px-2 font-semibold underline"
          >
            reload the page
          </button>
          .
        </span>
      ) : null}
      {PlayerComponent ? (
        <PlayerComponent item={item} open={open} onOpenChange={setOpen} returnFocusRef={trigger} />
      ) : null}
    </>
  );
}
