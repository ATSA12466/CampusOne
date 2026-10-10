"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge, Card } from "@/components/ui";
import { useAuthStore } from "@/stores/auth-store";
import { useAppStore } from "@/stores/app-store";

export function ProfileFeature() {
  const user = useAuthStore((state) => state.user);
  const memberships = useAppStore((state) => state.memberships);
  const tasks = useAppStore((state) => state.tasks);

  return (
    <div className="space-y-4">
      <PageHeader title="Profile" description="Your CampusOne identity, participation, and saved activity summary." />
      <Card>
        <h2 className="text-xl font-semibold">{user?.name ?? "Guest"}</h2>
        <p className="text-sm text-slate-600">{user?.programme} • {user?.level}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="primary">Role: {user?.role ?? "visitor"}</Badge>
          <Badge tone="success">Memberships: {memberships.filter((item) => item.status === "approved").length}</Badge>
          <Badge tone="warning">Open tasks: {tasks.filter((task) => !task.completed).length}</Badge>
        </div>
      </Card>
    </div>
  );
}
