import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cva } from "class-variance-authority";
import { CampusImage } from "./campus-image";
import { cn } from "@/lib/utils/cn";
import type { CampusMedia } from "@/types/media";

const variants = cva(
  "pressable group relative isolate block overflow-hidden rounded-media text-on-photo",
  {
    variants: { featured: { true: "min-h-72", false: "min-h-52" } },
    defaultVariants: { featured: false },
  },
);
export function PhotoTile({
  image,
  title,
  description,
  href,
  icon: Icon,
  featured,
  sizes,
  className,
}: {
  image?: CampusMedia;
  title: string;
  description?: string;
  href: string;
  icon?: LucideIcon;
  featured?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <Link prefetch={false} href={href} className={cn(variants({ featured }), className)}>
      <CampusImage
        image={image}
        alt={image?.alt ?? `${title} photo unavailable`}
        aspect="portrait"
        sizes={sizes}
        className="absolute inset-0 h-full w-full"
        imageClassName="media-zoom"
      />
      <div className="photo-scrim absolute inset-0" aria-hidden="true" />
      <div className="relative flex min-h-[inherit] flex-col justify-between p-5">
        {Icon ? <Icon className="size-6" aria-hidden="true" /> : <span />}
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-semibold">{title}</h3>
            {description ? <p className="mt-1 text-sm">{description}</p> : null}
          </div>
          <ArrowUpRight className="size-5 shrink-0" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
