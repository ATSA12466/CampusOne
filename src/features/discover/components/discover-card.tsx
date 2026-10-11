import Link from "next/link";
import { ArrowUpRight, Bookmark, LoaderCircle } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { Button } from "@/components/ui/button";
import { discoverLabels } from "@/config/discover";
import { discoverStatus } from "@/lib/discover/status";
import type { DiscoverItem } from "@/types/discover";
export function DiscoverCard({
  item,
  now,
  saved,
  ready,
  pending,
  disabled,
  onSave,
}: {
  item: DiscoverItem;
  now: Date;
  saved: boolean;
  ready: boolean;
  pending: boolean;
  disabled: boolean;
  onSave: () => void;
}) {
  const status = discoverStatus(item, now),
    action =
      item.destination === "board"
        ? "Open board"
        : item.destination === "library"
          ? "Open library"
          : "Explore details";
  const caption = item.illustrative
    ? "Category illustration · not this listing"
    : item.cover.provenance === "generated"
      ? "Generated demo illustration"
      : item.cover.provenance === "placeholder"
        ? "Placeholder illustration"
        : item.cover.provenance === "licensed"
          ? "Licensed sample imagery"
          : "Publisher-supplied photo";
  return (
    <article
      aria-label={item.title}
      data-discover-key={`${item.category}:${item.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-media border border-border bg-surface shadow-low"
    >
      <div className="relative">
        <Link
          prefetch={false}
          href={item.href}
          aria-label={`${action}: ${item.title}`}
          className="block"
        >
          <CampusImage
            image={item.cover}
            showProvenance={false}
            sizes="(max-width:639px) calc(100vw - 2rem), (max-width:1279px) 45vw, 320px"
            imageClassName="transition-transform motion-safe:group-hover:scale-[1.025]"
          />
        </Link>
        <Button
          size="icon"
          variant="overlay"
          className="absolute top-3 right-3"
          aria-label={`${pending ? "Saving" : saved ? "Unsave" : "Save"} ${item.title}`}
          aria-pressed={saved}
          disabled={!ready || disabled}
          onClick={onSave}
        >
          {pending ? (
            <LoaderCircle
              className="size-4 motion-safe:animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Bookmark
              className="size-4"
              fill={saved ? "currentColor" : "none"}
              aria-hidden="true"
            />
          )}
        </Button>
        <p className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] rounded-full bg-nav/85 px-2.5 py-1 text-[10px] font-semibold leading-relaxed text-on-photo">
          {caption}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-[10px] font-bold tracking-widest text-brand uppercase">
          {discoverLabels[item.category]}
        </p>
        <h3 className="font-display text-xl font-semibold leading-tight">
          <Link
            prefetch={false}
            href={item.href}
            className="inline-flex min-h-11 items-center rounded-control hover:text-brand"
          >
            {item.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
        <dl className="space-y-2 text-xs">
          {item.facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-start justify-between gap-3"
            >
              <dt className="shrink-0 text-muted-foreground">{fact.label}</dt>
              <dd className="min-w-0 text-right font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <p
            className={`text-[10px] font-semibold ${["Cancelled", "Event ended", "Deadline passed"].includes(status) ? "text-danger" : "text-muted-foreground"}`}
          >
            {status}
          </p>
          <Link
            prefetch={false}
            href={item.href}
            className="inline-flex min-h-11 items-center gap-1 rounded-control text-xs font-semibold text-brand"
          >
            {action}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
