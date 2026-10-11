"use client";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import type { MouseEventHandler } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { Avatar } from "@/components/ui/avatar";
import { AppearanceTrigger } from "@/components/theme/appearance-trigger";
import { Button } from "@/components/ui/button";
import { imageForSrc } from "@/config/images";
import { currentDestination } from "@/config/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";
export function ShellHeader({
  pathname,
  searchOpen,
  busy,
  onSearch,
}: {
  pathname: string;
  searchOpen: boolean;
  busy: boolean;
  onSearch: MouseEventHandler<HTMLButtonElement>;
}) {
  const user = useAuthStore((state) => state.user);
  const localPhoto = useAuthStore((state) => state.photo);
  const unread = useAppStore((state) => state.notifications.filter((item) => !item.read).length);
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-4 md:px-6 lg:px-8">
        <Link
          prefetch={false}
          href="/home"
          aria-label="CampusOne home"
          className="min-w-0 rounded-control lg:hidden"
        >
          <BrandMark
            size="sm"
            className="gap-2 text-sm [&>span:last-child>span]:text-[8px] [&>span:last-child>span]:tracking-[0.05em] [&>span:last-child>span]:whitespace-nowrap"
          />
        </Link>
        <div className="hidden min-w-0 lg:block">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            GCTU · student life
          </p>
          <p className="truncate text-sm font-semibold">
            {currentDestination(pathname)?.label ?? "CampusOne"}
            <span className="ml-2 text-[10px] font-normal text-muted-foreground">Demo</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <Button
            id="campus-search-trigger"
            variant="secondary"
            size="icon"
            className="md:w-64 md:justify-start md:gap-2 md:px-3 lg:w-72"
            onClick={onSearch}
            aria-label="Search campus"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
            aria-busy={busy || undefined}
            aria-keyshortcuts="Control+k Meta+k"
          >
            <Search className="size-5" aria-hidden="true" />
            <span className="hidden text-sm font-normal text-muted-foreground md:block">
              Search campus
            </span>
            <kbd
              aria-hidden="true"
              className="ml-auto hidden shrink-0 rounded-md border border-border px-1.5 text-[10px] whitespace-nowrap text-muted-foreground md:block"
            >
              Ctrl / Cmd K
            </kbd>
          </Button>
          <span className="hidden sm:inline-flex">
            <AppearanceTrigger />
          </span>
          <Link
            prefetch={false}
            href="/notifications"
            aria-label={`Notifications, ${unread} unread`}
            title="Notifications"
            className="relative grid size-11 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <Bell className="size-5" aria-hidden="true" />
            {unread ? (
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-semibold leading-4 text-on-brand"
              >
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>
          <Link
            prefetch={false}
            href="/profile"
            aria-label={`Open ${user?.name ?? "guest"} profile`}
            title="Your profile"
            className="rounded-full"
          >
            <Avatar
              name={user?.name ?? "Guest"}
              image={localPhoto ?? (user?.avatar ? imageForSrc(user.avatar) : undefined)}
              size="md"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
