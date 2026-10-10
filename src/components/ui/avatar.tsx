import { cva, type VariantProps } from "class-variance-authority";
import { CampusImage } from "@/components/media/campus-image";
import { cn } from "@/lib/utils/cn";
import type { CampusMedia } from "@/types/media";

const variants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-semibold text-brand ring-2 ring-surface",
  {
    variants: {
      size: {
        sm: "size-8 text-xs",
        md: "size-11 text-sm",
        lg: "size-14 text-lg",
        xl: "size-20 text-2xl",
      },
    },
    defaultVariants: { size: "md" },
  },
);
export function Avatar({
  name,
  image,
  size,
  className,
}: { name: string; image?: CampusMedia | null; className?: string } & VariantProps<
  typeof variants
>) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <span role="img" aria-label={name} className={cn(variants({ size }), className)}>
      <span aria-hidden="true">{initials}</span>
      {image ? (
        <CampusImage
          image={image}
          alt=""
          aspect="square"
          sizes={size === "xl" ? "80px" : "56px"}
          className="absolute inset-0 h-full w-full"
          showProvenance={false}
          fallback={<span className="text-on-photo">{initials}</span>}
        />
      ) : null}
    </span>
  );
}
export function AvatarStack({
  people,
  max = 4,
  total,
  className,
}: {
  people: readonly { name: string; image?: CampusMedia }[];
  max?: number;
  total?: number;
  className?: string;
}) {
  const remaining = Math.max(0, (total ?? people.length) - Math.min(max, people.length));
  return (
    <div
      className={cn("flex items-center -space-x-2", className)}
      aria-label={`${total ?? people.length} community members`}
    >
      {people.slice(0, max).map((person, index) => (
        <Avatar key={`${person.name}-${index}`} name={person.name} image={person.image} size="sm" />
      ))}
      {remaining > 0 ? (
        <span
          className="grid size-8 place-items-center rounded-full bg-surface-muted text-xs font-semibold text-muted-foreground ring-2 ring-surface"
          aria-label={`${remaining} more members`}
        >
          +{remaining}
        </span>
      ) : null}
    </div>
  );
}
