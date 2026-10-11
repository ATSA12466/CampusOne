"use client";
import { useMemo } from "react";
import { authService, authPreviewService } from "@/services";
import type { AuthPreview } from "@/types/auth";
export function useAuthService(preview?: AuthPreview) {
  return useMemo(() => (preview ? authPreviewService(preview) : authService), [preview]);
}
