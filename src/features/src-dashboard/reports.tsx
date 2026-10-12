"use client";
import { useMemo } from "react";
import { Download } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingFeed } from "@/components/shared/loading-feed";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { useCollection, useObject } from "@/features/admin/api";
import type { ClubRegistration, Nomination, StudentRequest } from "@/server/registry";
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

function byDay(items: { createdAt: string }[]): { day: string; count: number }[] {
  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    buckets.set(day, 0);
  }
  for (const item of items) {
    const day = item.createdAt.slice(0, 10);
    if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([day, count]) => ({ day, count }));
}

function TrendBars({ title, items }: { title: string; items: { createdAt: string }[] }) {
  const days = useMemo(() => byDay(items), [items]);
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <Card>
      <h2 className="text-base font-bold">{title}</h2>
      <p className="text-xs text-muted-foreground">Last 14 days · real records only</p>
      <div className="mt-4 flex h-28 items-end gap-1" role="img" aria-label={`${title}: ${items.length} total in 14 days`}>
        {days.map((d) => (
          <div
            key={d.day}
            title={`${d.day}: ${d.count}`}
            className="min-w-0 flex-1 rounded-t bg-brand/80"
            style={{ height: `${Math.max(6, (d.count / max) * 100)}%`, opacity: d.count ? 1 : 0.25 }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{days[0]?.day.slice(5)}</span>
        <span>{days[days.length - 1]?.day.slice(5)}</span>
      </div>
    </Card>
  );
}

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0] ?? {});
  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(","))].join("\n");
}

export function SrcReports() {
  const overview = useObject<Overview>("/api/src/overview");
  const clubs = useCollection<ClubRegistration>("/api/src/clubs");
  const nominations = useCollection<Nomination>("/api/src/nominations");
  const requests = useCollection<StudentRequest>("/api/src/requests");
  const loading = overview.loading || clubs.loading || nominations.loading || requests.loading;
  const error = overview.error ?? clubs.error ?? nominations.error ?? requests.error;
  const exportCsv = () => {
    const rows = [
      ...clubs.items.map((c) => ({ type: "club", title: c.name, status: c.status, date: c.createdAt.slice(0, 10), by: c.submittedByName })),
      ...nominations.items.map((n) => ({ type: "nomination", title: `${n.nomineeName} · ${n.position}`, status: n.status, date: n.createdAt.slice(0, 10), by: n.submittedByName })),
      ...requests.items.map((r) => ({ type: "request", title: r.subject, status: r.status, date: r.createdAt.slice(0, 10), by: r.submittedByName })),
    ];
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `src-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Participation reports"
        description="Real SRC records — club intake, nomination decisions and request volumes. No fabricated statistics."
        actions={
          <Button variant="secondary" onClick={exportCsv} disabled={loading || !!error}>
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>
        }
      />
      {loading ? (
        <LoadingFeed />
      ) : error ? (
        <ErrorState title="Reports could not load" description={error} onRetry={() => { overview.reload(); clubs.reload(); nominations.reload(); requests.reload(); }} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Club decisions" value={`${clubs.items.filter((c) => c.status !== "pending").length}/${clubs.items.length}`} detail="decided / submitted" tone="primary" />
            <StatTile label="Approval rate" value={clubs.items.length ? `${Math.round((clubs.items.filter((c) => c.status === "approved").length / clubs.items.length) * 100)}%` : "—"} detail="approved clubs" tone="success" />
            <StatTile label="Nomination backlog" value={nominations.items.filter((n) => n.status === "pending").length} detail="awaiting SRC review" tone="warning" />
            <StatTile label="Request resolution" value={requests.items.length ? `${Math.round((requests.items.filter((r) => r.status === "resolved" || r.status === "closed").length / requests.items.length) * 100)}%` : "—"} detail="resolved or closed" tone="success" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <TrendBars title="Club registrations" items={clubs.items} />
            <TrendBars title="Nominations" items={nominations.items} />
            <TrendBars title="Student requests" items={requests.items} />
          </div>
          {overview.data && overview.data.recent.length > 0 ? (
            <Card>
              <h2 className="text-base font-bold">Administrative activity</h2>
              <ol className="mt-3 space-y-2">
                {overview.data.recent.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2 text-sm last:border-0">
                    <span>
                      <span className="font-semibold">{entry.action}</span>{" "}
                      <span className="text-muted-foreground">{entry.detail || `${entry.targetType} · ${entry.targetId.slice(0, 12)}`}</span>
                    </span>
                    <time className="text-xs text-muted-foreground">
                      {new Date(entry.at).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </li>
                ))}
              </ol>
            </Card>
          ) : (
            <EmptyState title="No activity yet" description="Decisions and publications will build this history automatically." />
          )}
        </>
      )}
    </div>
  );
}
