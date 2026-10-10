"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge, Card } from "@/components/ui";
import { engagementService } from "@/services";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";

export function ParticipationFeature() {
  const user = useAuthStore((state) => state.user);
  const memberships = useAppStore((state) => state.memberships).filter(
    (item) => item.userId === user?.id,
  );
  const clubs = engagementService.listClubs();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Participation"
        description="Membership progress, activity transparency, and recognition milestones."
      />
      <Card>
        <h2 className="font-semibold">Club participation records</h2>
        <div className="mt-3 space-y-2">
          {memberships.map((membership) => (
            <div
              key={membership.id}
              className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3"
            >
              <p className="text-sm font-medium">
                {clubs.find((club) => club.id === membership.clubId)?.name}
              </p>
              <Badge
                tone={
                  membership.status === "approved"
                    ? "success"
                    : membership.status === "pending"
                      ? "warning"
                      : "danger"
                }
              >
                {membership.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">Recognition (demo badges)</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="gold">Active Member</Badge>
          <Badge tone="primary">Event Contributor</Badge>
          <Badge tone="success">Attendance Verified</Badge>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Badges are demo visual indicators and not official institutional awards.
        </p>
      </Card>
    </div>
  );
}
