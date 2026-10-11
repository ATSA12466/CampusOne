"use client";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { appConfig } from "@/config/app-config";
import { useAppStore } from "@/stores/app-store";
import { usePrivateCatalog } from "@/features/campus-feed/hooks/use-private-catalog";
import { useAuthAction } from "@/features/auth/hooks/use-auth-action";
import { notificationService } from "@/services";
export function OwnedNotifications() {
  const source = usePrivateCatalog("notifications"),
    local = useAppStore((s) => s.notifications),
    action = useAuthAction(),
    [view, setView] = useState("all"),
    [page, setPage] = useState(1),
    [notice, setNotice] = useState("");
  const all = appConfig.dataSource === "demo" ? local : source.items,
    filtered = all.filter(
      (n) =>
        view === "all" || (view === "unread" && !n.read) || n.category === view,
    ),
    pages = Math.max(1, Math.ceil(filtered.length / 6)),
    current = Math.min(page, pages);
  const read = async (ids: string[]) => {
    const result = await action.run((signal) =>
      notificationService.read(ids, { signal }),
    );
    if (result) {
      setNotice(
        result.persisted
          ? "Read state saved for this profile."
          : "Read for this visit only; storage is unavailable.",
      );
      source.refresh();
    }
  };
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold">
          {all.filter((n) => !n.read).length} unread updates
        </h2>
        <Button
          variant="secondary"
          disabled={action.pending || !all.some((n) => !n.read)}
          onClick={() => void read(all.filter((n) => !n.read).map((n) => n.id))}
        >
          Mark all as read
        </Button>
      </div>
      <Select
        aria-label="Filter notifications"
        value={view}
        onChange={(e) => {
          setView(e.target.value);
          setPage(1);
        }}
      >
        <option value="all">All loaded updates</option>
        <option value="unread">Unread</option>
        <option value="tasks">Tasks</option>
        <option value="events">Events</option>
        <option value="clubs">Clubs</option>
        <option value="announcement">Announcements</option>
      </Select>
      {source.error && appConfig.dataSource === "api" ? (
        <div role="alert">
          <p>{source.error}</p>
          <Button onClick={source.refresh}>Retry notifications</Button>
        </div>
      ) : null}
      {action.error ? (
        <p role="alert" className="text-sm text-danger">
          {action.error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-xs text-muted-foreground">
          {notice}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Demo notifications are illustrative reminders, not official alerts.
        Filtering covers loaded updates. Supplied titles do not promise that a
        task or message is currently due.
      </p>
      <div className="space-y-3">
        {filtered.slice((current - 1) * 6, current * 6).map((n) => (
          <Card key={n.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words font-display text-xl font-semibold">
                  {n.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {n.description}
                </p>
                <Link
                  className="mt-3 inline-flex min-h-11 items-center text-sm text-brand"
                  href={n.href}
                >
                  Open destination
                </Link>
              </div>
              <Badge tone={n.read ? "neutral" : "primary"}>
                {n.read ? "Read" : "Unread"}
              </Badge>
            </div>
            {!n.read ? (
              <Button
                size="sm"
                className="mt-2"
                variant="secondary"
                disabled={action.pending}
                onClick={() => void read([n.id])}
              >
                Mark as read
              </Button>
            ) : null}
          </Card>
        ))}
      </div>
      {!filtered.length ? (
        <Card>
          <h3 className="font-display text-xl">All quiet in this view.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try another filter or come back for new publisher updates.
          </p>
        </Card>
      ) : null}
      <Pagination
        page={current}
        totalPages={pages}
        onPageChange={setPage}
        label="Notification pages"
      />
    </section>
  );
}
