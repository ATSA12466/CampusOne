"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui";
import { primaryNav, workspaceNav } from "@/components/navigation/nav-config";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth-store";

const mobilePrimary = [
  { label: "Home", href: "/home" },
  { label: "Discover", href: "/discover" },
  { label: "Tasks", href: "/tasks" },
  { label: "Community", href: "/community" },
];

export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[var(--color-border)] bg-[var(--color-midnight-navy)] p-4 text-white lg:block">
        <Link href="/home" className="mb-8 block text-2xl font-bold tracking-tight text-[var(--color-gold)]">
          CampusOne
        </Link>
        <nav className="space-y-1">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  isActive(item.href) ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10",
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 border-t border-white/20 pt-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">My Workspace</p>
          <nav className="space-y-1">
            {workspaceNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                    isActive(item.href) ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10",
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu">
                <Menu size={16} />
              </Button>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">{user?.programme ?? "CampusOne Student"}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{user?.name ?? "Guest"}</p>
              <p className="text-xs text-slate-500">Demo session</p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:px-6 md:py-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--color-border)] bg-white p-1 lg:hidden">
        {mobilePrimary.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg py-2 text-[11px]",
              isActive(item.href) ? "text-[var(--color-royal-blue)]" : "text-slate-500",
            )}
          >
            {item.label}
          </Link>
        ))}
        <button
          className="flex flex-col items-center justify-center rounded-lg py-2 text-[11px] text-slate-500"
          onClick={() => setMenuOpen(true)}
        >
          More
        </button>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute right-0 top-0 h-full w-72 overflow-y-auto bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold">CampusOne Menu</p>
              <Button variant="ghost" size="sm" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu">
                <X size={16} />
              </Button>
            </div>
            <div className="space-y-1">
              {[...primaryNav, ...workspaceNav].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm",
                    isActive(item.href) ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
