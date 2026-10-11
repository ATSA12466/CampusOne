"use client";
import { useRouter } from "next/navigation";
import { authService } from "@/services";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthAction } from "./use-auth-action";
export function useSignOut() {
  const router = useRouter(),
    action = useAuthAction();
  const signOut = async () => {
    const confirmed = await action.run(async (signal) => {
      await authService.signOut({ signal });
      return true;
    });
    const saved = useAuthStore.getState().signOut();
    if (confirmed) {
      if (!saved)
        useAuthStore
          .getState()
          .setSessionIssue(
            "Signed out for this visit. Device storage was unavailable; saved data may remain when storage access returns.",
          );
      router.replace("/sign-in");
    } else
      useAuthStore
        .getState()
        .setSessionIssue(
          "Local account and activity cleared, but server sign-out could not be confirmed. Try again before leaving a shared device.",
        );
  };
  return { ...action, signOut };
}
