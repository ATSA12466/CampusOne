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
import { Textarea } from "@/components/ui/textarea";
import { adminFetch, useCollection, AdminApiError } from "@/features/admin/api";
import { StatusPill } from "@/features/admin/components/status-pill";
import type { Listing } from "@/server/admin";

function ListingCard({ item, onDecided }: { item: Listing; onDecided: (l: Listing) => void }) {
  const [note, setNote] = useState(item.note);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const decide = async (status: "approved" | "rejected") => {
    setBusy(true);
    setError(null);
    try {
      const { item: next } = await adminFetch<{ item: Listing }>(
        `/api/admin/listings/${item.id}`,
        { method: "PATCH", body: JSON.stringify({ status, note }) },
      );
      onDecided(next);
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "The decision could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold">{item.title}</h3>
          <p className="text-sm text-muted-foreground">
            {item.area} · GH₵{item.price.toLocaleString()} / {item.period} · {item.beds} bed{item.beds === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-muted-foreground">
            Listed by {item.submittedByName} · contact {item.contact}
          </p>
        </div>
        <StatusPill status={item.status} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
      {item.status === "pending" ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-control bg-warning-soft/60 px-3 py-2 text-xs text-warning">
            Verify the address, price and contact before approving. Only approved listings are
            visible to students.
          </div>
          <Field label="Verification note" id={`lst-note-${item.id}`}>
            <Textarea id={`lst-note-${item.id}`} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} rows={2} />
          </Field>
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => decide("approved")} disabled={busy}>
              {busy ? "Saving…" : "Verify & publish"}
            </Button>
            <Button variant="danger" onClick={() => decide("rejected")} disabled={busy}>
              Reject
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={item.status === "approved" ? "success" : "danger"}>
            {item.status === "approved" ? "Verified" : "Rejected"}
          </Badge>
          {item.note && <span className="text-xs text-muted-foreground">{item.note}</span>}
        </div>
      )}
    </Card>
  );
}

export function AdminAccommodation() {
  const { items, loading, error, reload, setItems } = useCollection<Listing>("/api/admin/listings");
  const pending = items.filter((i) => i.status === "pending");
  const decided = items.filter((i) => i.status !== "pending");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Accommodation verification"
        description="New listings stay hidden until verified. Approvals publish to the student app immediately."
      />
      {loading ? (
        <LoadingFeed />
      ) : error ? (
        <ErrorState title="Listings could not load" description={error} onRetry={reload} />
      ) : (
        <>
          <section aria-labelledby="pending-listings" className="space-y-3">
            <h2 id="pending-listings" className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Awaiting verification ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <EmptyState title="Queue is clear" description="Submitted hostel and room listings will wait here for verification." />
            ) : (
              pending.map((item) => (
                <ListingCard key={item.id} item={item} onDecided={(next) => setItems(items.map((i) => (i.id === next.id ? next : i)))} />
              ))
            )}
          </section>
          {decided.length > 0 && (
            <section aria-labelledby="decided-listings" className="space-y-3">
              <h2 id="decided-listings" className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
                Decided ({decided.length})
              </h2>
              {decided.map((item) => (
                <ListingCard key={item.id} item={item} onDecided={(next) => setItems(items.map((i) => (i.id === next.id ? next : i)))} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
