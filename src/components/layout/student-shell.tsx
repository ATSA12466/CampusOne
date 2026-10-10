"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationRail } from "@/components/navigation/navigation-rail";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { NavigationDrawer } from "@/components/navigation/navigation-drawer";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth-store";

const mobilePrimary = [
  { label: "Home", href: "/home" },
  { label: "Discover", href: "/discover" },
  { label: "Tasks", href: "/tasks" },
  { label: "Community", href: "/community" },
];
export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuFocus = useRef<HTMLButtonElement | null>(null);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const openMenu = (event: MouseEvent<HTMLButtonElement>) => {
    menuFocus.current = event.currentTarget;
    setMenuOpen(true);
  };
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-100 inline-flex min-h-11 items-center -translate-y-[calc(100%+2rem)] rounded-control bg-brand px-4 py-3 text-on-brand focus:translate-y-0"
      >
        Skip to main content
      </a>
      <NavigationRail isActive={isActive} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-surface">
          <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-2 px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="lg:hidden"
                onClick={openMenu}
                aria-label="Open navigation menu"
              >
                <Menu className="size-4" aria-hidden="true" />
              </Button>
              <p className="truncate text-xs font-medium text-muted-foreground md:text-sm">
                {user?.programme ?? "CampusOne Student"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-foreground">{user?.name ?? "Guest"}</p>
                <p className="text-[11px] text-muted-foreground">Demo session</p>
              </div>
              <ThemeSwitcher compact />
            </div>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-7xl px-4 py-6 pb-28 outline-none md:px-6 md:pt-8 lg:pb-8"
        >
          {children}
        </main>
      </div>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        {mobilePrimary.map((item) => (
          <Link
            prefetch={false}
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex min-h-12 items-center justify-center rounded-control text-[11px] font-semibold",
              isActive(item.href) ? "text-brand" : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          className="min-h-12 rounded-control text-[11px] font-semibold text-muted-foreground"
          onClick={openMenu}
        >
          More
        </button>
      </nav>
      <NavigationDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        active={isActive}
        returnFocusRef={menuFocus}
      />
    </div>
  );
}
