import Link from "next/link";
import { navIcons } from "./nav-icons";
import { cn } from "@/lib/utils/cn";
import type { NavDestination } from "@/types/navigation";
import { isDestinationActive } from "@/config/navigation";
export function NavigationLink({
  item,
  pathname,
  inverse = false,
  onNavigate,
}: {
  item: NavDestination;
  pathname: string;
  inverse?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = navIcons[item.icon];
  const active = isDestinationActive(pathname, item.href);
  return (
    <Link
      prefetch={false}
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      title={item.label}
      className={cn(
        "nav-destination relative flex min-h-11 items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors",
        inverse
          ? active
            ? "bg-nav-hover text-nav-foreground"
            : "text-nav-muted hover:bg-nav-hover hover:text-nav-foreground"
          : active
            ? "bg-brand-soft text-brand"
            : "text-foreground hover:bg-surface-muted",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="nav-label truncate">{item.label}</span>
      {active ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-3 bottom-3 left-0 w-0.5 rounded-full",
            inverse ? "bg-accent" : "bg-brand",
          )}
        />
      ) : null}
    </Link>
  );
}
