"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { onboardingStorageKey } from "@/config/auth";
import { storedOnboarding } from "@/lib/auth/profile";
import { noteStorageFailure, safeJsonStorage } from "@/lib/auth/persistence";
import type { ProfileSetup } from "@/types/auth";
interface OnboardingState {
  completed: boolean;
  hydrated: boolean;
  step: number;
  preferences: ProfileSetup;
  finishHydration: () => void;
  setStep: (step: number) => void;
  setPreferences: (preferences: ProfileSetup) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  resetPersonalization: () => void;
}
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...storedOnboarding(null),
      hydrated: false,
      finishHydration: () => set({ hydrated: true }),
      setStep: (step) => set({ step: Math.min(4, Math.max(0, step)) }),
      setPreferences: (preferences) => set({ preferences }),
      completeOnboarding: () => set({ completed: true, step: 0 }),
      resetOnboarding: () => set({ completed: false, step: 0 }),
      resetPersonalization: () => set({ preferences: storedOnboarding(null).preferences }),
    }),
    {
      name: onboardingStorageKey,
      storage: safeJsonStorage,
      skipHydration: true,
      partialize: (state) => ({
        completed: state.completed,
        step: state.step,
        preferences: state.preferences,
      }),
      merge: (persisted, current) => ({ ...current, ...storedOnboarding(persisted) }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) noteStorageFailure(onboardingStorageKey);
      },
    },
  ),
);
