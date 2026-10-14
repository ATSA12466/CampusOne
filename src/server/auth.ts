// Node-safe authentication core: registration, credentials, sessions, profiles.
// Route handlers live in src/app/api; this module owns validation + persistence.
import { z } from "zod";
import { hashPassword, newId, newToken, sha256, verifyPassword } from "./crypto";
import { effectivePermissions, toLegacyRole } from "./permissions";
import { store } from "./store";
import type { ServerSession, ServerUser, SessionUser } from "./types";

export const SESSION_COOKIE = "campusone_session";
export const SESSION_TTL_DAYS = 14;

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128),
  programme: z.string().trim().max(120).default(""),
  level: z.string().trim().max(40).default(""),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export const profilePatchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  programme: z.string().trim().max(120).optional(),
  level: z.string().trim().max(40).optional(),
});

export type AuthErrorCode =
  | "invalid-credentials"
  | "email-taken"
  | "account-suspended"
  | "session-expired";

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;
  constructor(code: AuthErrorCode, message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

const userSchema = z.object({
  id: z.string().min(1).max(80),
  email: z.string().email().max(254),
  name: z.string().min(2).max(80),
  passwordHash: z.string().min(16),
  roles: z.array(z.string().min(1).max(40)).min(1),
  programme: z.string().max(120),
  level: z.string().max(40),
  avatar: z.string().max(500).optional(),
  status: z.enum(["active", "suspended"]),
  verifiedStudent: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

function publicUser(user: ServerUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: toLegacyRole(user.roles),
    roles: [...user.roles],
    permissions: effectivePermissions(user),
    programme: user.programme,
    level: user.level,
    avatar: user.avatar,
    verifiedStudent: user.verifiedStudent,
  };
}

async function issueSession(
  userId: string,
  meta: { ip?: string; userAgent?: string; deviceName?: string; client?: string } = {},
): Promise<{ token: string; session: ServerSession }> {
  const token = newToken("c1s");
  const now = new Date();
  const session: ServerSession = {
    tokenHash: sha256(token),
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_DAYS * 86_400_000).toISOString(),
    ...(meta.ip ? { ip: meta.ip } : {}),
    ...(meta.userAgent ? { userAgent: meta.userAgent.slice(0, 300) } : {}),
    ...(meta.deviceName ? { deviceName: meta.deviceName.slice(0, 120) } : {}),
    ...(meta.client ? { client: meta.client.slice(0, 40) } : {}),
  };
  await store.insert("sessions", session as unknown as Record<string, unknown>);
  return { token, session };
}

export async function registerUser(
  input: z.infer<typeof registerSchema>,
  meta: { ip?: string; userAgent?: string } = {},
): Promise<{ user: SessionUser; token: string }> {
  const parsed = registerSchema.parse(input);
  const existing = store.find<ServerUser>("users", (u) => u.email === parsed.email);
  if (existing) throw new AuthError("email-taken", "An account with this email already exists.", 409);
  const now = new Date().toISOString();
  const row = userSchema.parse({
    id: newId("u"),
    email: parsed.email,
    name: parsed.name,
    passwordHash: await hashPassword(parsed.password),
    roles: ["student"],
    programme: parsed.programme,
    level: parsed.level,
    status: "active",
    verifiedStudent: false,
    createdAt: now,
    updatedAt: now,
  });
  await store.insert("users", row as unknown as Record<string, unknown>);
  const user = row as unknown as ServerUser;
  const { token } = await issueSession(user.id, meta);
  return { user: publicUser(user), token };
}

export async function loginUser(
  input: z.infer<typeof loginSchema>,
  meta: { ip?: string; userAgent?: string; deviceName?: string; client?: string } = {},
): Promise<{ user: SessionUser; token: string }> {
  const parsed = loginSchema.parse(input);
  const user = store.find<ServerUser>("users", (u) => u.email === parsed.email);
  if (!user || !(await verifyPassword(parsed.password, user.passwordHash)))
    throw new AuthError("invalid-credentials", "Email or password is incorrect.", 401);
  if (user.status !== "active")
    throw new AuthError("account-suspended", "This account has been suspended.", 403);
  const { token } = await issueSession(user.id, meta);
  return { user: publicUser(user), token };
}

/** Extract a Bearer token from an Authorization header (native mobile clients). */
export function parseBearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^\s*Bearer\s+([A-Za-z0-9._~+/-]+=*)\s*$/i.exec(header);
  const token = match?.[1] ?? "";
  if (!token || token.length > 200) return null;
  return token;
}

export const mobileTokenSchema = loginSchema.extend({
  deviceName: z.string().trim().max(120).default(""),
});

/** Native login: same session table as web; caller must store the token securely. */
export async function issueMobileToken(
  input: z.infer<typeof mobileTokenSchema>,
  meta: { ip?: string; userAgent?: string } = {},
): Promise<{ user: SessionUser; token: string; expiresAt: string }> {
  const parsed = mobileTokenSchema.parse(input);
  const { user, token } = await loginUser(parsed, {
    ...meta,
    deviceName: parsed.deviceName || undefined,
    client: "mobile",
  });
  const session = store.find<ServerSession>("sessions", (s) => s.tokenHash === sha256(token));
  return {
    user,
    token,
    expiresAt:
      session?.expiresAt ?? new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000).toISOString(),
  };
}

export async function getSessionUser(token: string | null | undefined): Promise<SessionUser | null> {  if (!token || token.length > 200) return null;
  const session = store.find<ServerSession>("sessions", (s) => s.tokenHash === sha256(token));
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await store.remove<ServerSession>("sessions", (s) => s.tokenHash === session.tokenHash);
    return null;
  }
  const user = store.find<ServerUser>("users", (u) => u.id === session.userId);
  if (!user || user.status !== "active") return null;
  return publicUser(user);
}

export async function destroySession(token: string | null | undefined): Promise<void> {
  if (!token) return;
  await store.remove<ServerSession>("sessions", (s) => s.tokenHash === sha256(token));
}

export async function updateProfile(
  userId: string,
  patch: z.infer<typeof profilePatchSchema>,
): Promise<SessionUser | null> {
  const parsed = profilePatchSchema.parse(patch);
  const now = new Date().toISOString();
  await store.update<ServerUser>("users", (u) => u.id === userId, {
    ...parsed,
    updatedAt: now,
  } as Partial<ServerUser>);
  const user = store.find<ServerUser>("users", (u) => u.id === userId);
  return user ? publicUser(user) : null;
}

export async function getServerUser(userId: string): Promise<ServerUser | null> {
  return store.find<ServerUser>("users", (u) => u.id === userId);
}
