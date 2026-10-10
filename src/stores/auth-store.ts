"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { demoUser } from "@/data/demo/core/user";
import { demoAuthService } from "@/services/auth/demo-auth.service";
import type { UserProfile, UserRole } from "@/types";

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
