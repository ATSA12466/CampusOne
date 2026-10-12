import {
  BarChart3,
  Inbox,
  LayoutDashboard,
  Megaphone,
  UserCheck,
  Users,
} from "lucide-react";
import type { AdminNavItem } from "@/features/admin/components/admin-shell";

export const srcNav: readonly AdminNavItem[] = [
  { href: "/src", label: "Overview", icon: LayoutDashboard },
  { href: "/src/clubs", label: "Clubs", icon: Users },
  { href: "/src/appointments", label: "Appointments", icon: UserCheck },
  { href: "/src/content", label: "Content", icon: Megaphone },
  { href: "/src/requests", label: "Requests", icon: Inbox },
  { href: "/src/reports", label: "Reports", icon: BarChart3 },
];
