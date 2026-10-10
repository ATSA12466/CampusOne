export type NavIcon =
  | "home"
  | "compass"
  | "clubs"
  | "events"
  | "community"
  | "academics"
  | "timetable"
  | "calendar"
  | "tasks"
  | "study"
  | "housing"
  | "market"
  | "lostFound"
  | "opportunities"
  | "council"
  | "announcements"
  | "messages"
  | "notifications"
  | "participation"
  | "media"
  | "profile"
  | "settings"
  | "management"
  | "advertising";
export interface NavDestination {
  label: string;
  href: string;
  icon: NavIcon;
  description: string;
  keywords?: string;
}
export interface NavGroup {
  id: string;
  label: string;
  destinations: readonly NavDestination[];
}
export type SidebarPreference = "expanded" | "compact";
export type ShellOverlay = "menu" | "search" | null;
