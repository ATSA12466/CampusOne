"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  Building2,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Palette,
  ScrollText,
  Settings2,
  ShieldAlert,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { LockedState } from "./locked-state";

export type AdminNavIcon =
  | "overview"
  | "users"
  | "roles"
  | "branding"
  | "content"
  | "housing"
  | "moderation"
  | "audit"
  | "settings"
  | "clubs"
  | "appointments"
  | "announcements"
  | "requests"
  | "reports";

const navIcons: Record<AdminNavIcon, LucideIcon> = {
  overview: LayoutDashboard,
  users: Users,
  roles: UserCog,
  branding: Palette,
  content: BookOpenCheck,
  housing: Building2,
  moderation: ShieldAlert,
  audit: ScrollText,
  settings: Settings2,
  clubs: Users,
  appointments: UserCheck,
  announcements: Megaphone,
  requests: Inbox,
  reports: BarChart3,
};

export interface AdminNavItem {
  href: string;
  label: string;
  icon: AdminNavIcon;
}

export function AdminShell({
  area,
  title,
  strapline,
  nav,
  userName,
  allowed,
  children,
}: {
  area: string;
  title: string;
  strapline: string;
  nav: readonly AdminNavItem[];
  userName: string | null;
  allowed: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#admin-content"
        className="fixed top-3 left-3 z-100 inline-flex min-h-11 items-center -translate-y-[calc(100%+2rem)] rounded-control bg-brand px-4 py-3 text-on-brand focus:translate-y-0"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark size="sm" />
            <span className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-bold">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{strapline}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              prefetch={false}
              href="/home"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-semibold text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Student app
            </Link>
            <Avatar name={userName ?? "Guest"} size="md" />
          </div>
        </div>
        <nav aria-label={`${title} sections`} className="border-t border-border">
          <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 md:px-6 lg:px-8">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = navIcons[item.icon] ?? LayoutDashboard;
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    prefetch={false}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold whitespace-nowrap transition-colors",
                      active
                        ? "bg-brand-soft text-brand"
                        : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main
        id="admin-content"
        tabIndex={-1}
        className="mx-auto max-w-7xl px-4 py-6 outline-none md:px-6 md:py-8 lg:px-8"
      >
        {allowed ? children : <LockedState area={area} />}
      </main>
    </div>
  );
}
