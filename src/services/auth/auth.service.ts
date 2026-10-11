import { appConfig } from "@/config/app-config";
import type { AuthService } from "@/types/auth";
let selected: Promise<AuthService> | undefined;
function service() {
  selected ??= (
    appConfig.dataSource === "api"
      ? import("./api-auth.service").then((m) => m.apiAuthActions)
      : import("./demo-actions.service").then((m) => m.demoAuthActions)
  ).catch((error: unknown) => {
    selected = undefined;
    throw error;
  });
  return selected;
}
export const authService: AuthService = {
  source: appConfig.dataSource,
  async signIn(input, options) {
    return (await service()).signIn(input, options);
  },
  async register(input, options) {
    return (await service()).register(input, options);
  },
  async requestReset(email, options) {
    return (await service()).requestReset(email, options);
  },
  async session(options) {
    return (await service()).session(options);
  },
  async signOut(options) {
    return (await service()).signOut(options);
  },
};
