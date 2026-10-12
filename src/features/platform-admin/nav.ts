import {
  BookOpenCheck,
  Building2,
  LayoutDashboard,
  Palette,
  ScrollText,
  Settings2,
  ShieldAlert,
  UserCog,
  Users,
} from "lucide-react";
import type { AdminNavItem } from "@/features/admin/components/admin-shell";

export const adminNav: readonly AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/roles", label: "Roles", icon: UserCog },
  { href: "/admin/branding", label: "Branding", icon: Palette },
  { href: "/admin/content", label: "Content", icon: BookOpenCheck },
  { href: "/admin/accommodation", label: "Housing", icon: Building2 },
  { href: "/admin/moderation", label: "Moderation", icon: ShieldAlert },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
];
