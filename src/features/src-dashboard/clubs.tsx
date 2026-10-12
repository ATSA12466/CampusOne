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
import { Textarea } from "@/components/ui/textarea";
import { adminFetch, useCollection, AdminApiError } from "@/features/admin/api";
import { StatusPill } from "@/features/admin/components/status-pill";
import type { ClubRegistration } from "@/server/registry";

function DecisionCard({ item, onDecided }: { item: ClubRegistration; onDecided: (next: ClubRegistration) => void }) {
  const [note, setNote] = useState(item.note);
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const decide = async (status: "approved" | "rejected") => {
    setBusy(status);
    setError(null);
    try {
      const { item: next } = await adminFetch<{ item: ClubRegistration }>(
        `/api/src/clubs/${item.id}`,
        { method: "PATCH", body: JSON.stringify({ status, note }) },
      );
      onDecided(next);
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "The decision could not be saved.");
    } finally {
      setBusy(null);
    }
  };
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold">{item.name}</h3>
          <p className="text-xs text-muted-foreground">
            Submitted by {item.submittedByName} · {new Date(item.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="primary">{item.category}</Badge>
          <StatusPill status={item.status} />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
      {item.objectives.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {item.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      )}
      {item.status === "pending" ? (
        <div className="mt-4 space-y-3">
          <Field label="Decision note (shared with the record)" id={`note-${item.id}`}>
            <Textarea
              id={`note-${item.id}`}
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why is this club approved, or what should change before resubmission?"
            />
          </Field>
          {error && (
            <p role="alert" className="text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => decide("approved")} disabled={busy !== null}>
              {busy === "approved" ? "Approving…" : "Approve club"}
            </Button>
            <Button variant="danger" onClick={() => decide("rejected")} disabled={busy !== null}>
              {busy === "rejected" ? "Rejecting…" : "Reject"}
            </Button>
          </div>
        </div>
      ) : (
        item.note && (
          <p className="mt-3 rounded-control bg-surface-muted/70 px-3 py-2 text-sm">
            <span className="font-semibold">Decision note: </span>
            {item.note}
          </p>
        )
      )}
    </Card>
  );
}

function SubmitForm({ onCreated }: { onCreated: (item: ClubRegistration) => void }) {
  const [form, setForm] = useState({ name: "", category: "", description: "", objectives: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const { item } = await adminFetch<{ item: ClubRegistration }>("/api/src/clubs", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          objectives: form.objectives.split("\n").map((o) => o.trim()).filter(Boolean).slice(0, 8),
        }),
      });
      onCreated(item);
      setForm({ name: "", category: "", description: "", objectives: "" });
      setDone(true);
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "The registration could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <Card>
      <h2 className="text-base font-bold">Register a club</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Intake for paper forms or walk-in registrations. New entries arrive as pending.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Club name" id="club-name">
          <Input id="club-name" value={form.name} maxLength={120} onChange={set("name")} placeholder="GCTU Robotics Club" />
        </Field>
        <Field label="Category" id="club-category">
          <Input id="club-category" value={form.category} maxLength={60} onChange={set("category")} placeholder="Technology" />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Description (20+ characters)" id="club-description">
          <Textarea id="club-description" value={form.description} maxLength={2000} onChange={set("description")} rows={4} />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Objectives, one per line (optional)" id="club-objectives">
          <Textarea id="club-objectives" value={form.objectives} onChange={set("objectives")} rows={3} />
        </Field>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{error}</p>}
      {done && <p role="status" className="mt-2 text-sm font-semibold text-success">Registration saved as pending.</p>}
      <Button className="mt-3" onClick={submit} disabled={busy}>
        {busy ? "Saving…" : "Submit registration"}
      </Button>
    </Card>
  );
}

export function SrcClubs() {
  const { items, loading, error, reload, setItems } = useCollection<ClubRegistration>("/api/src/clubs");
  const pending = items.filter((i) => i.status === "pending");
  const decided = items.filter((i) => i.status !== "pending");
  const replace = (next: ClubRegistration) =>
    setItems(items.map((i) => (i.id === next.id ? next : i)));
  return (
    <div className="space-y-6">
      <PageHeader
        title="Club registrations"
        description="Review new club applications, record decisions with notes, and keep an intake path for paper forms."
      />
      {loading ? (
        <LoadingFeed />
      ) : error ? (
        <ErrorState title="Registrations could not load" description={error} onRetry={reload} />
      ) : (
        <>
          <section aria-labelledby="pending-clubs" className="space-y-3">
            <h2 id="pending-clubs" className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Awaiting decision ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <EmptyState title="No pending registrations" description="New student club applications will appear here for review." />
            ) : (
              pending.map((item) => <DecisionCard key={item.id} item={item} onDecided={replace} />)
            )}
          </section>
          <SubmitForm onCreated={(item) => setItems([item, ...items])} />
          {decided.length > 0 && (
            <section aria-labelledby="decided-clubs" className="space-y-3">
              <h2 id="decided-clubs" className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
                Decided ({decided.length})
              </h2>
              {decided.map((item) => (
                <DecisionCard key={item.id} item={item} onDecided={replace} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
