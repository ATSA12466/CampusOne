import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

const variants = cva("skeleton-sheen bg-surface-inset", {
  variants: {
    shape: {
      line: "h-4 rounded-md",
      circle: "size-11 rounded-full",
      card: "aspect-video rounded-media",
      block: "rounded-control",
    },
  },
  defaultVariants: { shape: "line" },
});
export function Skeleton({
  className,
  shape,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof variants>) {
  return <div aria-hidden="true" className={cn(variants({ shape }), className)} {...props} />;
}
export function MediaCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-media border border-border bg-surface"
      aria-label="Loading campus content"
      role="status"
    >
      <Skeleton shape="card" className="rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="w-1/3" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="w-2/3" />
        <span className="sr-only">Loading campus content…</span>
      </div>
    </div>
  );
}
