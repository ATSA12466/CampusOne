import type { AuthPreview, AuthService, AuthOptions } from "@/types/auth";
export function createAuthPreview(base: AuthService, mode: AuthPreview): AuthService {
  let failed = false;
  const before = async (options?: AuthOptions) => {
    options?.signal?.throwIfAborted();
    if (mode === "error" && !failed) {
      failed = true;
      throw new Error("Controlled demo preview failure. Your inputs are still here; try again.");
    }
    if (mode === "slow")
      await new Promise<void>((resolve, reject) => {
        const aborted = () => {
          clearTimeout(timer);
          reject(options?.signal?.reason);
        };
        const timer = setTimeout(() => {
          options?.signal?.removeEventListener("abort", aborted);
          resolve();
        }, 3500);
        options?.signal?.addEventListener("abort", aborted, { once: true });
      });
    options?.signal?.throwIfAborted();
  };
  return {
    source: base.source,
    async signIn(input, options) {
      await before(options);
      return base.signIn(input, options);
    },
    async register(input, options) {
      await before(options);
      return base.register(input, options);
    },
    async requestReset(email, options) {
      await before(options);
      return base.requestReset(email, options);
    },
    async session(options) {
      return base.session(options);
    },
    async signOut(options) {
      return base.signOut(options);
    },
  };
}
