"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { NavigationRail } from "@/components/navigation/navigation-rail";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import { useShellOverlays } from "@/hooks/use-shell-overlays";
import { ShellHeader } from "./shell-header";
import { OverlayFeedback } from "./overlay-feedback";
export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const panels = useShellOverlays();
  const { MenuComponent, SearchComponent, setOverlay } = panels;
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    setOverlay(null);
    const frame = requestAnimationFrame(() =>
      document.getElementById("main-content")?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [pathname, setOverlay]);
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-100 inline-flex min-h-11 items-center -translate-y-[calc(100%+2rem)] rounded-control bg-brand px-4 py-3 text-on-brand focus:translate-y-0"
      >
        Skip to main content
      </a>
      <NavigationRail pathname={pathname} />
      <div className="campus-content">
        <ShellHeader
          pathname={pathname}
          searchOpen={panels.overlay === "search"}
          busy={panels.pending === "search"}
          onSearch={(event) => panels.open("search", event.currentTarget)}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-7xl px-4 py-6 pb-28 outline-none md:px-6 md:pt-8 lg:px-8 lg:pb-10"
        >
          {children}
        </main>
      </div>
      <MobileNavigation
        pathname={pathname}
        menuOpen={panels.overlay === "menu"}
        busy={panels.pending === "menu"}
        onMore={(event) => panels.open("menu", event.currentTarget)}
      />
      {MenuComponent ? (
        <MenuComponent
          open={panels.overlay === "menu"}
          onOpenChange={(open) => setOverlay(open ? "menu" : null)}
          pathname={pathname}
          returnFocusRef={panels.menuFocus}
        />
      ) : null}
      {SearchComponent ? (
        <SearchComponent
          open={panels.overlay === "search"}
          onOpenChange={(open) => setOverlay(open ? "search" : null)}
          returnFocusRef={panels.searchFocus}
        />
      ) : null}
      <OverlayFeedback
        loading={!!panels.overlay && panels.pending === panels.overlay}
        failed={!!panels.overlay && panels.failed === panels.overlay}
        onReload={() => window.location.reload()}
        onCancel={panels.closeFeedback}
      />
    </div>
  );
}
