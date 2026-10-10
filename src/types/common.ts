export type UserRole = "student" | "club-executive" | "committee-member" | "src-representative" | "administrator";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  programme: string;
  level: string;
  avatar?: string;
}

export interface Bookmark {
  id: string;
  entityId: string;
  entityType:
    | "resource"
    | "announcement"
    | "opportunity"
    | "event"
    | "marketplace"
    | "media"
    | "community";
}
