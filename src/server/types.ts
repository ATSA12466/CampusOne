// Node-safe server domain types (no Next.js imports).
import type { UserRole } from "../types/common";

/** Extended platform roles (server-side). Mapped to legacy UserRole for old clients. */
export type PlatformRole =
  | "student"
  | "verified-student"
  | "club-member"
  | "club-executive"
  | "club-president"
  | "committee-member"
  | "src-representative"
  | "src-executive"
  | "src-admin"
  | "moderator"
  | "vendor"
  | "administrator"
  | "super-admin";

export type UserStatus = "active" | "suspended";

export interface ServerUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  roles: PlatformRole[];
  programme: string;
  level: string;
  avatar?: string;
  status: UserStatus;
  verifiedStudent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServerSession {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  detail?: string;
  ip?: string;
}

/** Public session payload returned to callers (never includes password hash). */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roles: PlatformRole[];
  permissions: string[];
  programme: string;
  level: string;
  avatar?: string;
  verifiedStudent: boolean;
}
