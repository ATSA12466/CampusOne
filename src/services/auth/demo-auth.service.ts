import type { DemoAuthService } from "@/types/service-contracts";
import { demoUser } from "@/data/demo/core/user";
import type { UserProfile, UserRole } from "@/types";

export const demoAuthService = {
  initialUser: (): UserProfile => ({ ...demoUser }),
  signInByRole: (role: UserRole): UserProfile => ({ ...demoUser, role }),
} satisfies DemoAuthService;
