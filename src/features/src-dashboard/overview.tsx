"use client";
import Link from "next/link";
import { ArrowRight, BellRing, Inbox, UserCheck, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingFeed } from "@/components/shared/loading-feed";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { useObject } from "@/features/admin/api";
import type { AuditEntry } from "@/server/types";

interface Overview {
  counts: {
    pendingClubs: number;
    pendingNominations: number;
    activeAppointments: number;
    publishedAnnouncements: number;
    openRequests: number;
  };
  recent: AuditEntry[];
}

const quickLinks = [
  { href: "/src/clubs", label: "Review club registrations", detail: "Approve new student communities." },
  { href: "/src/appointments", label: "Decide nominations", detail: "Confirm executives and committees." },
  { href: "/src/content", label: "Publish an announcement", detail: "Reach students across campus." },
  { href: "/src/requests", label: "Triage student requests", detail: "Respond to concerns and welfare cases." },
];

export function SrcOverview() {
  const { data, loading, error, reload } = useObject<Overview>("/api/src/overview");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Good work starts with a clear desk."
        description="Pending registrations, nominations, announcements and student requests — everything the SRC team needs to decide today."
      />
      {loading ? (
        <LoadingFeed />
      ) : error || !data ? (
        <ErrorState title="The overview could not load" description={error ?? "Please retry."} onRetry={reload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatTile label="Pending clubs" value={data.counts.pendingClubs} icon={Users} tone={data.counts.pendingClubs ? "warning" : "neutral"} />
            <StatTile label="Nominations" value={data.counts.pendingNominations} icon={UserCheck} tone={data.counts.pendingNominations ? "warning" : "neutral"} />
            <StatTile label="Active appointments" value={data.counts.activeAppointments} icon={UserCheck} tone="primary" />
            <StatTile label="Live announcements" value={data.counts.publishedAnnouncements} icon={BellRing} tone="primary" />
            <StatTile label="Open requests" value={data.counts.openRequests} icon={Inbox} tone={data.counts.openRequests ? "gold" : "neutral"} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="text-base font-bold">Start with these</h2>
              <ul className="mt-3 divide-y divide-border">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      prefetch={false}
                      href={link.href}
                      className="group flex items-center justify-between gap-3 py-3"
                    >
                      <span>
                        <span className="block text-sm font-semibold group-hover:text-brand">
                          {link.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">{link.detail}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-brand" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold">Recent activity</h2>
                <Button asChild variant="secondary" size="sm">
                  <Link prefetch={false} href="/src/reports">
                    Reports
                  </Link>
                </Button>
              </div>
              {data.recent.length === 0 ? (
                <div className="mt-3">
                  <EmptyState
                    title="Nothing recorded yet"
                    description="Approvals, publications and triage decisions will appear here."
                  />
                </div>
              ) : (
                <ol className="mt-3 space-y-2">
                  {data.recent.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start justify-between gap-3 rounded-control bg-surface-muted/60 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{entry.action}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {entry.detail || `${entry.targetType} · ${entry.targetId.slice(0, 12)}`}
                        </span>
                      </span>
                      <time className="shrink-0 text-xs text-muted-foreground">
                        {new Date(entry.at).toLocaleDateString("en-GH", {
                          day: "numeric",
                          month: "short",
                        })}
                      </time>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
