"use client";
import { useEffect } from "react";
import { authService } from "@/services";
import { useAuthStore } from "@/stores/auth-store";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { sameAccount } from "@/lib/auth/profile";
import { useAppStore } from "@/stores/app-store";
import { noteStorageFailure } from "@/lib/auth/persistence";
import { authStorageKey } from "@/config/auth";
export function SessionBootstrap() {
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve(useOnboardingStore.persist.rehydrate()).finally(() =>
      useOnboardingStore.getState().finishHydration(),
    );
    void Promise.resolve(useAuthStore.persist.rehydrate())
      .then(async () => {
        if (authService.source === "api") {
          try {
            const session = await authService.session({ signal: controller.signal });
            if (!controller.signal.aborted) {
              if (session) useAuthStore.getState().setSession(session, false);
              else useAuthStore.getState().signOut();
            }
          } catch {
            if (!controller.signal.aborted) {
              useAuthStore.getState().signOut();
              useAuthStore
                .getState()
                .setSessionIssue(
                  "The API session could not be confirmed. Sign in or try again; no demo account was substituted.",
                );
            }
          }
        } else if (!useAuthStore.getState().user && !useAuthStore.getState().sessionIssue) {
          useAuthStore.getState().signOut();
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) useAuthStore.getState().finishHydration();
      });
    const synchronize = (event: StorageEvent) => {
      if (authService.source !== "demo" || (event.key !== authStorageKey && event.key !== null))
        return;
      if (event.newValue === null) {
        useAuthStore.getState().signOut();
        return;
      }
      const previous = useAuthStore.getState().user;
      void Promise.resolve(useAuthStore.persist.rehydrate()).then(() => {
        const current = useAuthStore.getState().user;
        if (!current) useAuthStore.getState().signOut();
        else if (!sameAccount(previous, current)) {
          useAuthStore.getState().clearPhoto();
          try {
            useAppStore.getState().clearAccount();
          } catch {
            noteStorageFailure("campusone-app");
          }
          void useOnboardingStore.persist.rehydrate();
        }
      });
    };
    window.addEventListener("storage", synchronize);
    return () => {
      controller.abort();
      window.removeEventListener("storage", synchronize);
    };
  }, []);
  return null;
}
