import type { CollectionName } from "@/types/service-contracts";

// Proposed resource paths; adapt here to the real API without changing catalog consumers.
export const apiEndpoints = {
  featured: "/home/featured",
  clubs: "/clubs",
  events: "/events",
  opportunities: "/opportunities",
  accommodation: "/accommodation",
  marketplace: "/marketplace",
  resources: "/resources",
  courses: "/courses",
  posts: "/community/posts",
  conversations: "/messages",
  notifications: "/notifications",
  media: "/media",
  announcements: "/announcements",
  timetable: "/timetable",
  representatives: "/src-office/representatives",
  projects: "/src-office/projects",
  campaigns: "/advertising",
  lostFound: "/lost-found",
} as const satisfies Record<CollectionName, string>;
