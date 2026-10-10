"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { isThemePreference, theme } from "@/config/theme";
import type { ThemeContextValue, ThemePreference } from "@/types/theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);
const eventName = "campusone:theme";
function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.themePreference = preference;
  root.style.colorScheme = root.dataset.theme;
}
function snapshot() {
  const root = document.documentElement;
  return `${root.dataset.themePreference ?? "system"}|${root.dataset.theme ?? "light"}`;
}
function subscribe(notify: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const systemChanged = () => {
    const current = document.documentElement.dataset.themePreference;
    if (current === "system") applyTheme("system");
    notify();
  };
  const storageChanged = (event: StorageEvent) => {
    if (event.key === theme.storageKey || event.key === null) {
      applyTheme(isThemePreference(event.newValue) ? event.newValue : "system");
      notify();
    }
  };
  window.addEventListener(eventName, notify);
  window.addEventListener("storage", storageChanged);
  media.addEventListener("change", systemChanged);
  return () => {
    window.removeEventListener(eventName, notify);
    window.removeEventListener("storage", storageChanged);
    media.removeEventListener("change", systemChanged);
  };
}
function setTheme(preference: ThemePreference) {
  try {
    localStorage.setItem(theme.storageKey, preference);
  } catch {
    /* Private mode: keep the preference for this document. */
  }
  applyTheme(preference);
  window.dispatchEvent(new Event(eventName));
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, snapshot, () => "system|light");
  const [candidate, resolved] = state.split("|");
  const preference = isThemePreference(candidate) ? candidate : "system";
  return (
    <ThemeContext.Provider
      value={{ preference, resolved: resolved === "dark" ? "dark" : "light", setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
