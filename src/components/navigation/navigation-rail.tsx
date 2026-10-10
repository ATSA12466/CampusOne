"use client";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { navigationGroups } from "@/config/navigation";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { NavigationLink } from "./navigation-link";

export function NavigationRail({ pathname }: { pathname: string }) {
  const { compact, toggle } = useSidebarPreference();
  const Icon = compact ? PanelLeftOpen : PanelLeftClose;
  return (
    <aside
      aria-label="CampusOne sidebar"
      className="campus-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-nav-hover bg-nav text-nav-foreground lg:flex"
    >
      <div className="sidebar-brand flex shrink-0 items-center justify-between gap-1 px-4 py-5">
        <Link
          prefetch={false}
          href="/home"
          aria-label="CampusOne home"
          className="inline-flex min-h-11 items-center rounded-control"
        >
          <span className="sidebar-full-brand">
            <BrandMark tone="inverse" size="sm" />
          </span>
          <span className="sidebar-mini-brand">
            <BrandMark tone="inverse" wordmark={false} />
          </span>
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!compact}
          aria-controls="sidebar-destinations"
          title={compact ? "Expand sidebar" : "Collapse sidebar"}
          className="grid size-11 shrink-0 place-items-center rounded-control text-nav-muted transition-colors hover:bg-nav-hover hover:text-nav-foreground"
        >
          <Icon className="size-5" aria-hidden="true" />
        </button>
      </div>
      <nav
        id="sidebar-destinations"
        aria-label="Campus navigation"
        className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-4 pb-5"
      >
        {navigationGroups.map((group) => (
          <section key={group.id} aria-label={group.label} className="nav-group space-y-1">
            <h2 className="nav-group-label mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-nav-muted uppercase">
              {group.label}
            </h2>
            {group.destinations.map((item) => (
              <NavigationLink key={item.href} item={item} pathname={pathname} inverse />
            ))}
          </section>
        ))}
      </nav>
      <div className="shrink-0 border-t border-nav-hover px-5 py-4">
        <p className="sidebar-note text-xs leading-5 text-nav-muted">
          Made for GCTU student life.
          <br />
          <span className="text-nav-foreground">Demo · not an official service</span>
        </p>
        <span className="sidebar-mini-brand text-[10px] font-semibold text-nav-muted">DEMO</span>
      </div>
    </aside>
  );
}
