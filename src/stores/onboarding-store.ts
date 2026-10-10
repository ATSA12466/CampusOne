"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  completed: boolean;
  hydrated: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      hydrated: false,
      completeOnboarding: () => set({ completed: true }),
      resetOnboarding: () => set({ completed: false }),
    }),
    {
      name: "campusone-onboarding",
      partialize: (state) => ({ completed: state.completed }),
      onRehydrateStorage: () => () => {
        useOnboardingStore.setState({ hydrated: true });
      },
    },
  ),
);
