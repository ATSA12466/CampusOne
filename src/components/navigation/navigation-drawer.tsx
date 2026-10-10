"use client";

import Link from "next/link";
import type { RefObject } from "react";
import { Sheet } from "@/components/ui/dialog";
import { primaryNav, workspaceNav } from "./nav-config";
import { cn } from "@/lib/utils/cn";

export function NavigationDrawer({
  open,
  onOpenChange,
  active,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: (href: string) => boolean;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="CampusOne menu"
      description="Explore your campus and student workspace."
      returnFocusRef={returnFocusRef}
    >
      <nav aria-label="More campus destinations" className="grid gap-1 sm:grid-cols-2">
        {[...primaryNav, ...workspaceNav].map((item) => (
          <Link
            prefetch={false}
            key={item.href}
            href={item.href}
            aria-current={active(item.href) ? "page" : undefined}
            onClick={() => onOpenChange(false)}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm",
              active(item.href)
                ? "bg-brand-soft font-semibold text-brand"
                : "text-foreground hover:bg-surface-muted",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
    </Sheet>
  );
}
