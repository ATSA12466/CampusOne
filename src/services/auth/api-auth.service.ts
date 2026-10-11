import { z } from "zod";
import { apiClient, ApiError } from "../api/client";
import {
  authResponseSchema,
  sessionResponseSchema,
  resetResponseSchema,
} from "../validation/auth.schema";
import type { AuthOptions, AuthService } from "@/types/auth";
function signal(options?: AuthOptions) {
  return options?.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000);
}
export const apiAuthActions: AuthService = {
  source: "api",
  async signIn(input, options) {
    const result = await apiClient("/auth/sign-in", {
      method: "POST",
      body: JSON.stringify({ email: input.email, password: input.password }),
      schema: authResponseSchema,
      signal: signal(options),
      cache: "no-store",
    });
    return { ...result, source: "api" };
  },
  async register(input, options) {
    const result = await apiClient("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: input.name, email: input.email, password: input.password }),
      schema: authResponseSchema,
      signal: signal(options),
      cache: "no-store",
    });
    return { ...result, source: "api" };
  },
  async requestReset(email, options) {
    await apiClient("/auth/password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
      schema: resetResponseSchema,
      signal: signal(options),
      cache: "no-store",
    });
    return { delivery: "requested" };
  },
  async session(options) {
    try {
      const result = await apiClient("/auth/session", {
        schema: sessionResponseSchema,
        signal: signal(options),
        cache: "no-store",
      });
      return result.user ? { user: result.user, source: "api" } : null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  async signOut(options) {
    await apiClient("/auth/sign-out", {
      method: "POST",
      schema: z.union([z.undefined(), z.object({ ok: z.literal(true) })]),
      signal: signal(options),
      cache: "no-store",
    });
  },
};
