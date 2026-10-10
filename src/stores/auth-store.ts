"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, UserRole } from "@/types";
import { demoAuthService } from "@/services";

const demoUser = demoAuthService.initialUser();

interface AuthState {
  user: UserProfile | null;
  role: UserRole;
  signInDemo: (role: UserRole) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: demoUser,
      role: demoUser.role,
      signInDemo: (role) => set({ user: demoAuthService.signInByRole(role), role }),
      signOut: () => set({ user: null }),
    }),
    { name: "campusone-auth" },
  ),
);
