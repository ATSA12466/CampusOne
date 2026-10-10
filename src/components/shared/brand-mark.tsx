import { cva, type VariantProps } from "class-variance-authority";
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
export function BrandMark({
  tone,
  size,
  className,
  wordmark = true,
}: VariantProps<typeof variants> & { className?: string; wordmark?: boolean }) {
  return (
    <span className={cn(variants({ tone, size }), className)}>
      {srcLogo ? (
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
          CampusOne
          <span className="block text-[10px] font-medium tracking-[0.13em] opacity-70">
            YOUR CAMPUS, CONNECTED
          </span>
        </span>
      ) : null}
    </span>
  );
}
