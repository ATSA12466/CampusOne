// Route-side club/event management checks: scoped grants, registry ownership,
// global event managers and super-admins (via can()).
import { can, type Permission } from "@/server/permissions";
import { registry } from "@/server/registry";
import type { ServerUser } from "@/server/types";
import type { EventRef } from "./lookup";

const CLUB_SCOPED: readonly Permission[] = [
  "club.members.view",
  "club.members.manage",
  "club.events.manage",
  "club.attendance.manage",
  "club.badges.manage",
  "club.resources.manage",
];

export function canManageClub(
  user: ServerUser,
  clubId: string,
  permission: Permission,
): boolean {
  if (!clubId) return false;
  if (can(user, permission, { type: "club", id: clubId })) return true;
  // Manage implies view: member managers can read rosters, officers and resources.
  if (
    permission === "club.members.view" &&
    can(user, "club.members.manage", { type: "club", id: clubId })
  )
    return true;
  if (!CLUB_SCOPED.includes(permission)) return false;
  const owned = registry.listClubs("approved").find((club) => club.id === clubId);
  return !!owned && owned.submittedBy === user.id;
}

export function canManageEvent(
  user: ServerUser,
  event: EventRef,
  permission: Permission,
): boolean {
  if (event.clubId && canManageClub(user, event.clubId, permission)) return true;
  return can(user, "events.manage");
}
