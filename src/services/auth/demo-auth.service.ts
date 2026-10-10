import { demoUser } from "@/data/demo/core/user";
import type { UserProfile, UserRole } from "@/types";

export const demoAuthService = {
  signInByRole: (role: UserRole): UserProfile => ({ ...demoUser, role }),
};
