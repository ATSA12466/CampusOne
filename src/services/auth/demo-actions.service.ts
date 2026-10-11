import { demoAuthService } from "./demo-auth.service";
import type { AuthService, AuthOptions } from "@/types/auth";
function check(options?: AuthOptions) {
  options?.signal?.throwIfAborted();
}
export const demoAuthActions: AuthService = {
  source: "demo",
  async signIn(input, options) {
    check(options);
    return {
      user: {
        ...demoAuthService.signInByRole(input.role ?? "student"),
        email: input.email.trim().toLowerCase(),
      },
      source: "demo",
    };
  },
  async register(input, options) {
    check(options);
    return {
      user: {
        ...demoAuthService.initialUser(),
        id: `local-${crypto.randomUUID()}`,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        role: "student",
        programme: "Not selected",
        level: "Not selected",
        avatar: undefined,
      },
      source: "demo",
    };
  },
  async requestReset(_email, options) {
    check(options);
    return { delivery: "preview" };
  },
  async session(options) {
    check(options);
    return null;
  },
  async signOut(options) {
    check(options);
  },
};
