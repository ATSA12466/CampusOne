import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  ClipboardList,
  Compass,
  Gauge,
  Handshake,
  House,
  Megaphone,
  MessageCircle,
  Users,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/home", icon: House },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Academics", href: "/academics", icon: BookOpen },
  { label: "Tasks", href: "/tasks", icon: ClipboardList },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Clubs", href: "/clubs", icon: Users },
  { label: "Participation", href: "/participation", icon: Handshake },
  { label: "Community", href: "/community", icon: MessageCircle },
  { label: "Events", href: "/events", icon: Bell },
  { label: "Opportunities", href: "/opportunities", icon: Briefcase },
  { label: "SRC Office", href: "/src-office", icon: Megaphone },
  { label: "Management", href: "/management", icon: Gauge },
  { label: "Accommodation", href: "/accommodation", icon: Building2 },
];

export const workspaceNav: NavItem[] = [
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: Users },
];
