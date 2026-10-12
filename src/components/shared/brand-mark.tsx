"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { useEffect, useState } from "react";
import { CampusImage } from "@/components/media/campus-image";
import { srcLogo } from "@/config/images";
import { cn } from "@/lib/utils/cn";

const variants = cva("inline-flex min-w-0 items-center gap-3", {
  variants: {
    tone: { default: "text-foreground", inverse: "text-on-photo" },
    size: { sm: "text-lg", md: "text-xl", lg: "text-2xl" },
  },
  defaultVariants: { tone: "default", size: "md" },
});

interface PublicBranding {
  displayName: string;
  tagline: string;
  logoLight: string;
  logoDark: string;
}

/** Header brand: built-in defaults first, enhanced by published Super Admin branding. */
export function BrandMark({
  tone,
  size,
  className,
  wordmark = true,
}: VariantProps<typeof variants> & { className?: string; wordmark?: boolean }) {
  const [branding, setBranding] = useState<PublicBranding | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/branding/public", { headers: { Accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { branding?: PublicBranding } | null) => {
        if (!cancelled && payload?.branding) setBranding(payload.branding);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const name = branding?.displayName?.trim() || "CampusOne";
  const tagline = branding?.tagline?.trim() || "YOUR CAMPUS, CONNECTED";
  const customLogo = branding?.logoLight?.trim() || "";
  return (
    <span className={cn(variants({ tone, size }), className)}>
      {customLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={customLogo}
          alt={`${name} logo`}
          className="size-11 shrink-0 rounded-control object-contain"
        />
      ) : srcLogo ? (
        <CampusImage
          image={srcLogo}
          aspect="square"
          fit="contain"
          sizes="44px"
          className="size-11 bg-transparent"
          showProvenance={false}
        />
      ) : (
        <span
          className="grid size-11 shrink-0 place-items-center rounded-control border border-current/25 text-[9px] leading-tight opacity-80"
          role="img"
          aria-label="Official SRC logo slot — artwork pending"
        >
          <span aria-hidden="true" className="text-center font-medium">
            SRC
            <br />
            logo slot
          </span>
        </span>
      )}
      {wordmark ? (
        <span className="font-semibold tracking-tight">
          {name}
          <span className="block text-[10px] font-medium tracking-[0.13em] opacity-70">
            {tagline.toUpperCase()}
          </span>
        </span>
      ) : null}
    </span>
  );
}
