"use client";

import Image from "next/image";
import { ImageOff, ImageIcon } from "lucide-react";
import { cva } from "class-variance-authority";
import { useState, type ReactNode, type CSSProperties } from "react";
import { isAllowedImageSrc } from "@/config/images";
import { cn } from "@/lib/utils/cn";
import type { AspectRatio, CampusMedia, FocalPoint } from "@/types/media";

export const imageFrame = cva("relative isolate overflow-hidden bg-surface-inset", {
  variants: {
    aspect: {
      square: "aspect-square",
      portrait: "aspect-[4/5]",
      tall: "aspect-[3/4]",
      video: "aspect-video",
      panorama: "aspect-[21/9]",
    },
  },
  defaultVariants: { aspect: "video" },
});
interface Props {
  image?: CampusMedia | null;
  alt?: string;
  aspect?: AspectRatio;
  fit?: "cover" | "contain";
  focalPoint?: FocalPoint;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  imageStyle?: CSSProperties;
  fallback?: ReactNode;
  showProvenance?: boolean;
}
export function CampusImage({ image, alt, aspect, className, ...props }: Props) {
  return (
    <div className={cn(imageFrame({ aspect }), className)}>
      <ImageContent
        key={image?.src ?? "missing"}
        {...props}
        image={image}
        alt={alt ?? image?.alt ?? "Campus photograph unavailable"}
      />
    </div>
  );
}
function ImageContent({
  image,
  alt,
  fit = "cover",
  focalPoint,
  sizes = "(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw",
  priority = false,
  imageClassName,
  imageStyle,
  fallback,
  showProvenance = true,
}: Omit<Props, "aspect" | "className"> & { alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!image?.src || !isAllowedImageSrc(image.src) || failed) {
    return (
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className="brand-gradient absolute inset-0 grid place-items-center p-4"
      >
        <div aria-hidden="true" className="flex flex-col items-center gap-2 text-center">
          {fallback ?? (
            <>
              <ImageOff className="size-7 opacity-75" />
              <span className="text-xs font-medium">Photo coming soon</span>
            </>
          )}
        </div>
      </div>
    );
  }
  const focal = focalPoint ?? image.focalPoint ?? { x: 50, y: 50 };
  return (
    <>
      {!loaded ? (
        <div
          aria-hidden="true"
          className="skeleton-sheen absolute inset-0 grid place-items-center bg-surface-inset"
        >
          <ImageIcon className="size-6 text-muted-foreground" />
        </div>
      ) : null}
      <Image
        src={image.src}
        alt={alt}
        fill
        sizes={sizes}
        preload={priority}
        loading={priority ? undefined : "lazy"}
        placeholder={image.blurDataURL ? "blur" : "empty"}
        blurDataURL={image.blurDataURL}
        unoptimized={image.src.startsWith("blob:")}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "transition-opacity duration-200",
          loaded ? "opacity-100" : "opacity-0",
          imageClassName,
        )}
        style={{
          objectFit: fit,
          objectPosition: `${Math.max(0, Math.min(100, focal.x))}% ${Math.max(0, Math.min(100, focal.y))}%`,
          ...imageStyle,
        }}
      />
      {showProvenance && image.provenance === "placeholder" ? (
        <span className="absolute right-2 bottom-2 rounded-full bg-nav/85 px-2 py-1 text-[10px] font-semibold text-on-photo">
          Placeholder
        </span>
      ) : null}
    </>
  );
}
