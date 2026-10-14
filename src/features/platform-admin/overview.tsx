"use client";
import Link from "next/link";
import { ArrowRight, Building2, ShieldAlert, UserCog, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingFeed } from "@/components/shared/loading-feed";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { useObject } from "@/features/admin/api";

interface AdminOverview {
  counts: {
    users: number;
    suspended: number;
    pendingListings: number;
    openReports: number;
    materials: number;
    pendingClubs: number;
    openRequests: number;
  };
  health: { store: string; sessions: number; auditEntries: number; database: string };
}

const quickLinks = [
  { href: "/admin/users", label: "Manage users", detail: "Verify students, suspend abuse, edit roles." },
  { href: "/admin/roles", label: "Scoped grants", detail: "Give club executives exactly the access they need." },
  { href: "/admin/branding", label: "Branding & appearance", detail: "Logos, icons, banners, names and colors." },
  { href: "/admin/accommodation", label: "Verify housing", detail: "Approve listings before students see them." },
  { href: "/admin/moderation", label: "Moderation queue", detail: "Review reports from across campus." },
  { href: "/admin/audit", label: "Audit log", detail: "Who changed what, and when." },
];

export function AdminOverview() {
  const { data, loading, error, reload } = useObject<AdminOverview>("/api/admin/overview");
  return (
    <div className="space-y-6">
      <PageHeader
        title="The whole platform, one desk."
        description="Users, permissions, branding, housing verification, moderation and the audit trail."
      />
      {loading ? (
        <LoadingFeed />
      ) : error || !data ? (
        <ErrorState title="The overview could not load" description={error ?? "Please retry."} onRetry={reload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Accounts" value={data.counts.users} icon={Users} tone="primary" detail={`${data.counts.suspended} suspended`} />
            <StatTile label="Housing queue" value={data.counts.pendingListings} icon={Building2} tone={data.counts.pendingListings ? "warning" : "neutral"} />
            <StatTile label="Open reports" value={data.counts.openReports} icon={ShieldAlert} tone={data.counts.openReports ? "danger" : "neutral"} />
            <StatTile label="Club applications" value={data.counts.pendingClubs} icon={UserCog} tone={data.counts.pendingClubs ? "gold" : "neutral"} detail={`${data.counts.openRequests} open SRC requests`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="text-base font-bold">Start with these</h2>
              <ul className="mt-3 divide-y divide-border">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link prefetch={false} href={link.href} className="group flex items-center justify-between gap-3 py-2.5">
                      <span>
                        <span className="block text-sm font-semibold group-hover:text-brand">{link.label}</span>
                        <span className="block text-xs text-muted-foreground">{link.detail}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-brand" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="text-base font-bold">System health</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Persistence</dt>
                  <dd className="font-semibold">File store (.data, gitignored)</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Active sessions</dt>
                  <dd className="font-semibold tabular-nums">{data.health.sessions}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Audit entries</dt>
                  <dd className="font-semibold tabular-nums">{data.health.auditEntries}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">PostgreSQL</dt>
                  <dd className="font-semibold">{data.health.database === "configured" ? "Configured (see /api/health)" : "Not configured — file store in use"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Published materials</dt>
                  <dd className="font-semibold tabular-nums">{data.counts.materials}</dd>
                </div>
              </dl>
              {data.counts.suspended + data.counts.openReports === 0 && (
                <div className="mt-3">
                  <EmptyState title="All quiet" description="No suspended accounts and no open moderation reports." />
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
