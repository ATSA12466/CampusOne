import Link from "next/link";
import { Ellipsis } from "lucide-react";
import type { MouseEventHandler } from "react";
import { mobileDestinations, isDestinationActive } from "@/config/navigation";
import { navIcons } from "./nav-icons";
import { cn } from "@/lib/utils/cn";
export function MobileNavigation({
  pathname,
  menuOpen,
  busy,
  onMore,
}: {
  pathname: string;
  menuOpen: boolean;
  busy: boolean;
  onMore: MouseEventHandler<HTMLButtonElement>;
}) {
  const moreActive = !mobileDestinations.some((item) => isDestinationActive(pathname, item.href));
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-5 rounded-card border border-border bg-surface p-1 shadow-raised lg:hidden"
    >
      {mobileDestinations.map((item) => {
        const Icon = navIcons[item.icon];
        const active = isDestinationActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            prefetch={false}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-control px-1 text-[10px] font-semibold transition-colors",
              active ? "bg-brand-soft text-brand" : "text-muted-foreground hover:bg-surface-muted",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        aria-busy={busy || undefined}
        aria-current={moreActive ? "page" : undefined}
        onClick={onMore}
        className={cn(
          "flex min-h-14 flex-col items-center justify-center gap-1 rounded-control px-1 text-[10px] font-semibold transition-colors",
          moreActive || menuOpen
            ? "bg-brand-soft text-brand"
            : "text-muted-foreground hover:bg-surface-muted",
        )}
      >
        <Ellipsis className="size-5" aria-hidden="true" />
        <span>More</span>
      </button>
    </nav>
  );
}
