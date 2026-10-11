import { useAuthStore } from "@/stores/auth-store";
import { appConfig } from "@/config/app-config";
export function serviceOwner() {
  const s = useAuthStore.getState();
  if (!s.user || !s.hydrated || s.source !== appConfig.dataSource)
    throw new Error(
      "Sign in with the active source before changing private records.",
    );
  return `${s.source}:${s.user.id}:${s.user.email.toLowerCase()}:${s.role}`;
}
