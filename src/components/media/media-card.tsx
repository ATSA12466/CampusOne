import Link from "next/link";
import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { CampusImage } from "./campus-image";
import { cn } from "@/lib/utils/cn";
import type { AspectRatio, CampusMedia } from "@/types/media";

const variants = cva(
  "group min-w-0 overflow-hidden rounded-media border border-border bg-surface text-foreground shadow-low",
  {
    variants: { featured: { true: "shadow-raised", false: "" } },
    defaultVariants: { featured: false },
  },
);
export function MediaCard({
  title,
  eyebrow,
  description,
  image,
  href,
  facts = [],
  action,
  aspect = "video",
  featured = false,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  image?: CampusMedia;
  href: string;
  facts?: readonly { label: string; value: string }[];
  action?: ReactNode;
  aspect?: AspectRatio;
  featured?: boolean;
  className?: string;
}) {
  return (
    <article className={cn(variants({ featured }), className)}>
      <Link prefetch={false} href={href} className="block pressable">
        <CampusImage
          image={image}
          alt={image?.alt ?? `${title} — photo unavailable`}
          aspect={aspect}
          imageClassName="media-zoom"
        />
        <div className="p-5">
          {eyebrow ? (
            <Badge tone="primary" className="mb-3">
              {eyebrow}
            </Badge>
          ) : null}
          <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight">
            {title}
          </h3>
          {description ? (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </Link>
      {facts.length || action ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <dl className="flex flex-wrap gap-x-5 gap-y-2">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {fact.label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold">{fact.value}</dd>
              </div>
            ))}
          </dl>
          {action}
        </div>
      ) : null}
    </article>
  );
}
