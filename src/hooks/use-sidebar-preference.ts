"use client";
import { useSyncExternalStore } from "react";
import { sidebarEvent, sidebarStorageKey } from "@/config/sidebar";
import type { SidebarPreference } from "@/types/navigation";
const read = (): SidebarPreference =>
  document.documentElement.dataset.sidebar === "compact" ? "compact" : "expanded";
function subscribe(notify: () => void) {
  const sync = (event: StorageEvent) => {
    if (event.key === sidebarStorageKey || event.key === null) {
      document.documentElement.dataset.sidebar =
        event.newValue === "compact" ? "compact" : "expanded";
      notify();
    }
  };
  window.addEventListener(sidebarEvent, notify);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener(sidebarEvent, notify);
    window.removeEventListener("storage", sync);
  };
}
function set(preference: SidebarPreference) {
  try {
    localStorage.setItem(sidebarStorageKey, preference);
  } catch {
    /* Document-local in private mode. */
  }
  document.documentElement.dataset.sidebar = preference;
  window.dispatchEvent(new Event(sidebarEvent));
}
export function useSidebarPreference() {
  const preference = useSyncExternalStore(subscribe, read, () => "expanded" as const);
  return {
    compact: preference === "compact",
    toggle: () => set(preference === "compact" ? "expanded" : "compact"),
  };
}
