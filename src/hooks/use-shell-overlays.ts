"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ShellOverlay } from "@/types/navigation";
type Menu = typeof import("@/components/navigation/navigation-drawer").NavigationDrawer;
type Search = typeof import("@/features/search").GlobalSearch;
export function useShellOverlays() {
  const [overlay, setOverlay] = useState<ShellOverlay>(null);
  const [MenuComponent, setMenu] = useState<Menu | null>(null);
  const [SearchComponent, setSearch] = useState<Search | null>(null);
  const [pending, setPending] = useState<ShellOverlay>(null);
  const [failed, setFailed] = useState<ShellOverlay>(null);
  const menuFocus = useRef<HTMLElement | null>(null);
  const searchFocus = useRef<HTMLElement | null>(null);
  const open = useCallback(
    (kind: Exclude<ShellOverlay, null>, trigger?: HTMLElement) => {
      const current =
        trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      const fallback = document.getElementById("campus-search-trigger");
      (kind === "menu" ? menuFocus : searchFocus).current = current?.closest('[role="dialog"]')
        ? fallback
        : current;
      setOverlay(kind);
      setFailed(null);
      if ((kind === "menu" && MenuComponent) || (kind === "search" && SearchComponent)) return;
      setPending(kind);
      const promise =
        kind === "menu"
          ? import("@/components/navigation/navigation-drawer").then((module) => {
              setMenu(() => module.NavigationDrawer);
            })
          : import("@/features/search").then((module) => {
              setSearch(() => module.GlobalSearch);
            });
      void promise
        .then(() => setPending((value) => (value === kind ? null : value)))
        .catch(() => {
          setPending((value) => (value === kind ? null : value));
          setFailed(kind);
        });
    },
    [MenuComponent, SearchComponent],
  );
  const closeFeedback = useCallback(() => {
    const target = (overlay === "menu" ? menuFocus : searchFocus).current;
    setOverlay(null);
    if (target?.isConnected) target.focus();
  }, [overlay]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        // Feature dialogs and the appearance menu own focus until they close.
        // More/Search can still switch because they share the shell overlay state.
        if (
          !overlay &&
          document.querySelector(
            '[role="dialog"][data-state="open"], [role="menu"][data-state="open"]',
          )
        )
          return;
        if (overlay === "search") setOverlay(null);
        else open("search");
      }
      if (event.key === "Escape" && (pending || failed)) closeFeedback();
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [open, overlay, pending, failed, closeFeedback]);
  return {
    overlay,
    setOverlay,
    open,
    pending,
    failed,
    closeFeedback,
    MenuComponent,
    SearchComponent,
    menuFocus,
    searchFocus,
  };
}
