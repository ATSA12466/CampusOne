// Node-safe RBAC: permission vocabulary, role defaults, scoped grants.
import { z } from "zod";
import { store } from "./store";
import type { PlatformRole, ServerUser } from "./types";
import type { UserRole } from "../types/common";

export const permissions = [
  "club.members.view",
  "club.members.manage",
  "club.events.manage",
  "club.attendance.manage",
  "club.badges.manage",
  "club.resources.manage",
  "src.appointments.review",
  "src.clubs.review",
  "src.content.publish",
  "src.requests.manage",
  "academic.materials.manage",
  "accommodation.listings.review",
  "accommodation.listings.manage",
  "marketplace.moderate",
  "community.moderate",
  "platform.users.manage",
  "platform.roles.manage",
  "platform.branding.manage",
  "platform.settings.manage",
  "platform.audit.view",
  "events.manage",
  "announcements.publish",
  "messages.moderate",
] as const;

export type Permission = (typeof permissions)[number];

export const permissionSchema = z.enum(permissions);

export type ScopeType = "global" | "club" | "event" | "user";

export interface Grant {
  id: string;
  userId: string;
  permission: Permission;
  scopeType: ScopeType;
  scopeId: string | null;
  grantedBy: string | null;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
}

export const grantSchema = z.object({
  id: z.string().min(1).max(80),
  userId: z.string().min(1).max(80),
  permission: permissionSchema,
  scopeType: z.enum(["global", "club", "event", "user"]),
  scopeId: z.string().max(80).nullable(),
  grantedBy: z.string().max(80).nullable(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
});

/** Any of these opens the SRC dashboard shell (each API still checks its own scope). */
export const srcDashboardPermissions: readonly Permission[] = [
  "src.requests.manage",
  "src.content.publish",
  "src.appointments.review",
  "src.clubs.review",
  "announcements.publish",
  "events.manage",
  "platform.users.manage",
];

/** Baseline permissions each role carries globally (scoped club rights come from grants). */
export const rolePermissions: Record<PlatformRole, readonly Permission[]> = {
  student: [],
  "verified-student": [],
  "club-member": ["club.members.view"],
  "club-executive": ["club.members.view", "club.members.manage"],
  "club-president": [
    "club.members.view",
    "club.members.manage",
    "club.events.manage",
    "club.attendance.manage",
    "club.badges.manage",
    "club.resources.manage",
  ],
  "committee-member": ["club.members.view"],
  "src-representative": ["src.requests.manage"],
  "src-executive": ["src.requests.manage", "src.content.publish", "announcements.publish"],
  "src-admin": [
    "src.requests.manage",
    "src.content.publish",
    "src.appointments.review",
    "src.clubs.review",
    "announcements.publish",
    "events.manage",
  ],
  moderator: ["community.moderate", "messages.moderate", "marketplace.moderate"],
  vendor: [],
  administrator: [
    "academic.materials.manage",
    "accommodation.listings.review",
    "accommodation.listings.manage",
    "marketplace.moderate",
    "community.moderate",
    "events.manage",
    "announcements.publish",
  ],
  "super-admin": [...permissions],
};

const legacyRoleMap: Record<PlatformRole, UserRole> = {
  student: "student",
  "verified-student": "student",
  "club-member": "student",
  "club-executive": "club-executive",
  "club-president": "club-executive",
  "committee-member": "committee-member",
  "src-representative": "src-representative",
  "src-executive": "src-representative",
  "src-admin": "src-representative",
  moderator: "student",
  vendor: "student",
  administrator: "administrator",
  "super-admin": "administrator",
};

const legacyRank: Record<UserRole, number> = {
  student: 0,
  "committee-member": 1,
  "club-executive": 2,
  "src-representative": 3,
  administrator: 4,
};

/** Highest legacy role for old clients; full roles stay server-side. */
export function toLegacyRole(roles: readonly PlatformRole[]): UserRole {
  let best: UserRole = "student";
  for (const role of roles) {
    const mapped = legacyRoleMap[role];
    if (legacyRank[mapped] > legacyRank[best]) best = mapped;
  }
  return best;
}

export interface Scope {
  type: ScopeType;
  id?: string;
}

function grantActive(grant: Grant, now: Date): boolean {
  if (grant.revokedAt) return false;
  if (grant.expiresAt && new Date(grant.expiresAt).getTime() <= now.getTime()) return false;
  return true;
}

/** All effective global permissions for a user (role defaults + active global grants). */
export function effectivePermissions(user: ServerUser, at = new Date()): Permission[] {
  const found = new Set<Permission>();
  for (const role of user.roles) for (const permission of rolePermissions[role]) found.add(permission);
  const grants = store.filter<Grant>("grants", (g) => g.userId === user.id);
  for (const grant of grants) {
    if (grant.scopeType === "global" && grantActive(grant, at)) found.add(grant.permission as Permission);
  }
  return [...found];
}

/**
 * Server-side authorization check. Scoped permissions (e.g. club.*) require a
 * matching active grant for that scope; global-only permissions ignore scope.
 */
export function can(
  user: ServerUser,
  permission: Permission,
  scope?: Scope,
  at = new Date(),
): boolean {
  if (user.status !== "active") return false;
  if (user.roles.includes("super-admin")) return true;
  const scoped: Permission[] = [
    "club.members.view",
    "club.members.manage",
    "club.events.manage",
    "club.attendance.manage",
    "club.badges.manage",
    "club.resources.manage",
  ];
  if (scope && scoped.includes(permission)) {
    if (!scope.id) return false;
    const grants = store.filter<Grant>(
      "grants",
      (g) =>
        g.userId === user.id &&
        g.permission === permission &&
        (g.scopeType === "global" || (g.scopeType === scope.type && g.scopeId === scope.id)),
    );
    return grants.some((g) => grantActive(g, at));
  }
  return effectivePermissions(user, at).includes(permission);
}
