"use client";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingFeed } from "@/components/shared/loading-feed";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adminFetch, useCollection, AdminApiError } from "@/features/admin/api";
import { StatusPill } from "@/features/admin/components/status-pill";
import type { ModerationReport } from "@/server/admin";

function ReportCard({ item, onSaved }: { item: ModerationReport; onSaved: (r: ModerationReport) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ status: item.status, assignee: item.assignee, resolution: item.resolution });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const { item: next } = await adminFetch<{ item: ModerationReport }>(
        `/api/admin/reports/${item.id}`,
        { method: "PATCH", body: JSON.stringify(form) },
      );
      onSaved(next);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "The report could not be updated.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold">{item.reason}</h3>
          <p className="text-xs text-muted-foreground">
            Reported by {item.reporterName} · {new Date(item.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="primary">{item.targetType}:{item.targetId.slice(0, 24)}</Badge>
          <StatusPill status={item.status === "open" ? "new" : item.status === "reviewing" ? "in-review" : item.status === "actioned" ? "resolved" : "closed"} />
        </div>
      </div>
      {item.detail && <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>}
      {item.resolution && (
        <p className="mt-2 rounded-control bg-surface-muted/70 px-3 py-2 text-sm">
          <span className="font-semibold">Resolution: </span>
          {item.resolution}
        </p>
      )}
      {!open ? (
        <Button variant="secondary" className="mt-3" onClick={() => setOpen(true)}>
          Review report
        </Button>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Status" id={`rep-status-${item.id}`}>
              <Select id={`rep-status-${item.id}`} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ModerationReport["status"] }))}>
                <option value="open">Open</option>
                <option value="reviewing">Reviewing</option>
                <option value="actioned">Actioned</option>
                <option value="dismissed">Dismissed</option>
              </Select>
            </Field>
            <Field label="Owner" id={`rep-owner-${item.id}`}>
              <Input id={`rep-owner-${item.id}`} value={form.assignee} maxLength={120} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} />
            </Field>
          </div>
          <Field label="Resolution note" id={`rep-resolution-${item.id}`}>
            <Textarea id={`rep-resolution-${item.id}`} value={form.resolution} maxLength={2000} onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))} rows={3} />
          </Field>
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save review"}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function AdminModeration() {
  const { items, loading, error, reload, setItems } = useCollection<ModerationReport>("/api/admin/reports");
  const queue = items.filter((i) => i.status === "open" || i.status === "reviewing");
  const done = items.filter((i) => i.status === "actioned" || i.status === "dismissed");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Moderation"
        description="Reports from posts, messages, listings and profiles. Review with a recorded outcome."
      />
      {loading ? (
        <LoadingFeed />
      ) : error ? (
        <ErrorState title="Reports could not load" description={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState title="No reports" description="When students report content, the queue builds here." />
      ) : (
        <>
          <section aria-labelledby="mod-queue" className="space-y-3">
            <h2 id="mod-queue" className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Queue ({queue.length})
            </h2>
            {queue.length === 0 ? (
              <EmptyState title="Queue is clear" description="Every report has an outcome. Well done." />
            ) : (
              queue.map((item) => (
                <ReportCard key={item.id} item={item} onSaved={(next) => setItems(items.map((i) => (i.id === next.id ? next : i)))} />
              ))
            )}
          </section>
          {done.length > 0 && (
            <section aria-labelledby="mod-done" className="space-y-3">
              <h2 id="mod-done" className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
                Resolved ({done.length})
              </h2>
              {done.map((item) => (
                <ReportCard key={item.id} item={item} onSaved={(next) => setItems(items.map((i) => (i.id === next.id ? next : i)))} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
