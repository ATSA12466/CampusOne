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
import type { StudentRequest } from "@/server/registry";

function RequestCard({ item, onSaved }: { item: StudentRequest; onSaved: (r: StudentRequest) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ status: item.status, assignee: item.assignee, resolution: item.resolution });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const { item: next } = await adminFetch<{ item: StudentRequest }>(
        `/api/src/requests/${item.id}`,
        { method: "PATCH", body: JSON.stringify(form) },
      );
      onSaved(next);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "The request could not be updated.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold">{item.subject}</h3>
          <p className="text-xs text-muted-foreground">
            From {item.submittedByName || "a student"} ·{" "}
            {new Date(item.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
            {item.contact ? ` · ${item.contact}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="primary">{item.category}</Badge>
          <StatusPill status={item.status} />
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
      {(item.assignee || item.resolution) && (
        <div className="mt-2 rounded-control bg-surface-muted/70 px-3 py-2 text-sm">
          {item.assignee && (
            <p>
              <span className="font-semibold">Owner: </span>
              {item.assignee}
            </p>
          )}
          {item.resolution && (
            <p>
              <span className="font-semibold">Resolution: </span>
              {item.resolution}
            </p>
          )}
        </div>
      )}
      {!open ? (
        <Button variant="secondary" className="mt-3" onClick={() => setOpen(true)}>
          Triage request
        </Button>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Status" id={`req-status-${item.id}`}>
              <Select
                id={`req-status-${item.id}`}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StudentRequest["status"] }))}
              >
                <option value="new">New</option>
                <option value="in-review">In review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Select>
            </Field>
            <Field label="Owner" id={`req-owner-${item.id}`}>
              <Input
                id={`req-owner-${item.id}`}
                value={form.assignee}
                maxLength={120}
                onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                placeholder="Welfare committee"
              />
            </Field>
          </div>
          <Field label="Resolution note" id={`req-resolution-${item.id}`}>
            <Textarea
              id={`req-resolution-${item.id}`}
              value={form.resolution}
              maxLength={2000}
              onChange={(e) => setForm((f) => ({ ...f, resolution: e.target.value }))}
              rows={3}
            />
          </Field>
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save triage"}
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

export function SrcRequests() {
  const { items, loading, error, reload, setItems } = useCollection<StudentRequest>("/api/src/requests");
  const open = items.filter((i) => i.status === "new" || i.status === "in-review");
  const closed = items.filter((i) => i.status === "resolved" || i.status === "closed");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student requests"
        description="Concerns, welfare cases and questions submitted by students. Triage with an owner and a recorded resolution."
      />
      {loading ? (
        <LoadingFeed />
      ) : error ? (
        <ErrorState title="Requests could not load" description={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No requests yet"
          description="Student requests submitted through the SRC Office will appear here for triage."
        />
      ) : (
        <>
          <section aria-labelledby="open-requests" className="space-y-3">
            <h2 id="open-requests" className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Needs attention ({open.length})
            </h2>
            {open.length === 0 ? (
              <EmptyState title="Inbox zero" description="Every request has been resolved or closed. Ayekoo!" />
            ) : (
              open.map((item) => (
                <RequestCard
                  key={item.id}
                  item={item}
                  onSaved={(next) => setItems(items.map((i) => (i.id === next.id ? next : i)))}
                />
              ))
            )}
          </section>
          {closed.length > 0 && (
            <section aria-labelledby="closed-requests" className="space-y-3">
              <h2 id="closed-requests" className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
                Resolved & closed ({closed.length})
              </h2>
              {closed.map((item) => (
                <RequestCard
                  key={item.id}
                  item={item}
                  onSaved={(next) => setItems(items.map((i) => (i.id === next.id ? next : i)))}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
