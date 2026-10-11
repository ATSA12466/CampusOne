"use client";
import { authStorageKey, onboardingStorageKey } from "@/config/auth";
import { storageFailed } from "@/lib/auth/persistence";
import { useAuthStore } from "@/stores/auth-store";
export function StorageNotice() {
  const hydrated = useAuthStore((state) => state.hydrated),
    issue = useAuthStore((state) => state.sessionIssue);
  return issue ||
    (hydrated &&
      (storageFailed(authStorageKey) ||
        storageFailed(onboardingStorageKey) ||
        storageFailed("campusone-app"))) ? (
    <p role="status" className="mb-4 rounded-control bg-warning-soft p-3 text-sm text-warning">
      {issue ||
        "Device storage is unavailable. Changes are for this visit only; saved data may remain when storage access returns."}
    </p>
  ) : null;
}
