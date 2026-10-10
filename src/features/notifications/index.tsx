"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Badge, Button, Card } from "@/components/ui";
import { useAppStore } from "@/stores/app-store";

export function NotificationsFeature() {
  const notifications = useAppStore((state) => state.notifications);
  const markRead = useAppStore((state) => state.markNotificationRead);

  return (
    <div className="space-y-4">
      <PageHeader title="Notifications" description="Track updates across tasks, events, clubs, and announcements." />
      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{notification.title}</p>
                <p className="text-sm text-slate-600">{notification.description}</p>
                <Link href={notification.href} className="text-xs text-blue-700">Open destination</Link>
              </div>
              {notification.read ? <Badge tone="success">Read</Badge> : <Badge tone="warning">Unread</Badge>}
            </div>
            {!notification.read ? <Button className="mt-3" size="sm" variant="secondary" onClick={() => markRead(notification.id)}>Mark as read</Button> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
