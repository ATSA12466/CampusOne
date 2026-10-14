import type { AdminNavItem } from "@/features/admin/components/admin-shell";

export const adminNav: readonly AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: "overview" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/roles", label: "Roles", icon: "roles" },
  { href: "/admin/branding", label: "Branding", icon: "branding" },
  { href: "/admin/content", label: "Content", icon: "content" },
  { href: "/admin/accommodation", label: "Housing", icon: "housing" },
  { href: "/admin/moderation", label: "Moderation", icon: "moderation" },
  { href: "/admin/audit", label: "Audit log", icon: "audit" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];
