"use client";
import type { RefObject } from "react";
import { Sheet } from "@/components/ui/dialog";
import { BrandMark } from "@/components/shared/brand-mark";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { navigationGroups } from "@/config/navigation";
import { NavigationLink } from "./navigation-link";
export function NavigationDrawer({
  open,
  onOpenChange,
  pathname,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Your campus, within reach."
      description="All your destinations. One student workspace."
      returnFocusRef={returnFocusRef}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <BrandMark size="sm" />
        <span className="text-xs text-muted-foreground">GCTU · Demo</span>
      </div>
      <nav aria-label="More campus destinations" className="grid gap-6 sm:grid-cols-2">
        {navigationGroups.map((group) => (
          <section key={group.id} aria-label={group.label}>
            <h2 className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground">
              {group.label}
            </h2>
            <div className="space-y-1">
              {group.destinations.map((item) => (
                <NavigationLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={() => onOpenChange(false)}
                />
              ))}
            </div>
          </section>
        ))}
      </nav>
      <div className="mt-6 border-t border-border pt-5">
        <p className="mb-3 text-xs font-semibold text-muted-foreground">
          Make yourself comfortable
        </p>
        <ThemeSwitcher />
      </div>
    </Sheet>
  );
}
