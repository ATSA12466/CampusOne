"use client";
import { clearPrivateWorkspace } from "@/lib/workspace/storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { appConfig } from "@/config/app-config";
import { authStorageKey } from "@/config/auth";
import { demoAuthService, localPhotoService } from "@/services";
import { sameAccount, storedAuth } from "@/lib/auth/profile";
import { noteStorageFailure, safeJsonStorage, storageFailed } from "@/lib/auth/persistence";
import { useOnboardingStore } from "./onboarding-store";
import { useAppStore } from "./app-store";
import type { UserProfile, UserRole } from "@/types/common";
import type { AuthSession, StoredAuth } from "@/types/auth";
import type { CampusMedia, ProcessedImage } from "@/types/media";
interface AuthState extends StoredAuth {
  hydrated: boolean;
  photo: CampusMedia | null;
  sessionIssue: string;
  finishHydration: () => void;
  setSession: (session: AuthSession, remember?: boolean) => void;
  setDemoProfile: (user: UserProfile) => void;
  setPhoto: (photo: ProcessedImage) => void;
  clearPhoto: () => void;
  signInDemo: (role: UserRole) => void;
  signOut: () => boolean;
  setSessionIssue: (message: string) => void;
}
function clearActivity(reseed = false) {
  const previous = useAuthStore.getState();
  clearPrivateWorkspace(previous.source, previous.user);
  try {
    (reseed ? useAppStore.getState().resetDemo : useAppStore.getState().clearAccount)();
  } catch {
    noteStorageFailure("campusone-app");
  }
}
const initialUser = appConfig.dataSource === "demo" ? demoAuthService.initialUser() : null;
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: initialUser,
      role: initialUser?.role ?? "student",
      source: appConfig.dataSource,
      remember: true,
      hydrated: false,
      photo: null,
      sessionIssue: "",
      finishHydration: () => set({ hydrated: true }),
      setSessionIssue: (sessionIssue) => set({ sessionIssue }),
      setSession: (session, remember = true) => {
        const previous = get().user;
        const user =
          session.source === "demo" &&
          previous?.id.startsWith("local-") &&
          !session.user.id.startsWith("local-") &&
          previous.email.toLowerCase() === session.user.email.toLowerCase()
            ? { ...previous, role: session.user.role }
            : session.user;
        if (get().source !== session.source || !sameAccount(previous, user)) {
          useOnboardingStore.getState().resetPersonalization();
          clearActivity(session.source === "demo" && !user.id.startsWith("local-"));
          localPhotoService.release();
          set({ photo: null });
        }
        set({
          user,
          role: user.role,
          source: session.source,
          remember: session.source === "demo" && remember,
          sessionIssue: "",
        });
      },
      setDemoProfile: (user) => {
        if (get().source === "demo") set({ user, role: user.role });
      },
      setPhoto: (photo) =>
        set({ photo: localPhotoService.create(photo, get().user?.name ?? "Your") }),
      clearPhoto: () => {
        localPhotoService.release();
        set({ photo: null });
      },
      signInDemo: (role) =>
        get().setSession({ user: demoAuthService.signInByRole(role), source: "demo" }),
      signOut: () => {
        clearActivity();
        useOnboardingStore.getState().resetPersonalization();
        localPhotoService.release();
        set({ user: null, role: "student", photo: null, sessionIssue: "" });
        return !storageFailed(authStorageKey) && !storageFailed("campusone-app");
      },
    }),
    {
      name: authStorageKey,
      storage: safeJsonStorage,
      skipHydration: true,
      partialize: (state) => ({
        user: state.source === "demo" && state.remember ? state.user : null,
        role: state.source === "demo" && state.remember ? state.role : "student",
        source: state.source,
        remember: state.remember,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(appConfig.dataSource === "demo"
          ? persisted === undefined
            ? {}
            : storedAuth(persisted)
          : { user: null, role: "student" as const, source: "api" as const, remember: false }),
      }),
      onRehydrateStorage: (state) => (_state, error) => {
        if (error) {
          state.signOut();
          state.setSessionIssue(
            "Saved profile data could not be read. Local account activity was cleared; you can start a new demo.",
          );
        }
      },
    },
  ),
);
