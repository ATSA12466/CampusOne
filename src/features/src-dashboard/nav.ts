import type { AdminNavItem } from "@/features/admin/components/admin-shell";

export const srcNav: readonly AdminNavItem[] = [
  { href: "/src", label: "Overview", icon: "overview" },
  { href: "/src/clubs", label: "Clubs", icon: "clubs" },
  { href: "/src/appointments", label: "Appointments", icon: "appointments" },
  { href: "/src/content", label: "Content", icon: "announcements" },
  { href: "/src/requests", label: "Requests", icon: "requests" },
  { href: "/src/reports", label: "Reports", icon: "reports" },
];
