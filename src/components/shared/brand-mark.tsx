"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { useEffect, useState } from "react";
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

/**
 * Header brand: the supplied SRC crest (or a Super Admin upload) beside the
 * wordmark. The artwork carries no tile, frame or background of its own — it
 * sits directly on the surface, so nothing square is drawn around the logo.
 */
export function BrandMark({
  tone,
  size,
  className,
  wordmark = true,
}: VariantProps<typeof variants> & { className?: string; wordmark?: boolean }) {
  const [branding, setBranding] = useState<PublicBranding | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
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
  // Published upload wins, then the council-supplied crest. A broken logo just
  // leaves the wordmark; no placeholder box is drawn in its place.
  const logoSrc = logoFailed ? "" : customLogo || srcLogo?.src || "";
  const logoAlt = customLogo ? `${name} logo` : (srcLogo?.alt ?? `${name} logo`);
  return (
    <span className={cn(variants({ tone, size }), className)}>
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt={logoAlt}
          width={44}
          height={44}
          onError={() => setLogoFailed(true)}
          className="size-11 shrink-0 object-contain"
        />
      ) : null}
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
