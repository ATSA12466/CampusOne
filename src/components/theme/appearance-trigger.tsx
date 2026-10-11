"use client";
import { Moon, Sun, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
type Switcher = typeof import("./theme-switcher").ThemeSwitcher;
// The light/dark bootstrap is eager; the menu/radio implementation is intent-loaded.
export function AppearanceTrigger() {
  const { preference, resolved } = useTheme();
  const [SwitcherComponent, setSwitcher] = useState<Switcher | null>(null);
  const [pending, setPending] = useState(false),
    [failed, setFailed] = useState(false);
  if (SwitcherComponent) return <SwitcherComponent compact defaultOpen />;
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        aria-haspopup="menu"
        aria-busy={pending || undefined}
        aria-label={`Change appearance; ${preference} theme selected`}
        onClick={() => {
          setPending(true);
          setFailed(false);
          void import("./theme-switcher")
            .then((module) => {
              setSwitcher(() => module.ThemeSwitcher);
              setPending(false);
            })
            .catch(() => {
              setPending(false);
              setFailed(true);
            });
        }}
      >
        {pending ? (
          <LoaderCircle
            className="size-5 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : resolved === "dark" ? (
          <Moon className="size-5" aria-hidden="true" />
        ) : (
          <Sun className="size-5" aria-hidden="true" />
        )}
      </Button>
      {failed ? (
        <p
          role="alert"
          className="fixed top-24 right-4 z-60 max-w-[min(22rem,calc(100vw-2rem))] rounded-card border border-border bg-danger-soft p-4 text-sm text-danger shadow-overlay"
        >
          Appearance menu unavailable. Save changes, then{" "}
          <button
            type="button"
            className="min-h-11 rounded-control px-2 underline"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </p>
      ) : null}
    </>
  );
}
