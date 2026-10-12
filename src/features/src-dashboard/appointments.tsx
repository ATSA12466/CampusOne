"use client";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingFeed } from "@/components/shared/loading-feed";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { adminFetch, useCollection, AdminApiError } from "@/features/admin/api";
import { StatusPill } from "@/features/admin/components/status-pill";
import type { Appointment, Nomination } from "@/server/registry";

function NominationCard({ item, onDecided }: { item: Nomination; onDecided: (n: Nomination) => void }) {
  const [note, setNote] = useState(item.note);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const decide = async (status: "approved" | "rejected") => {
    setBusy(true);
    setError(null);
    try {
      const { item: next } = await adminFetch<{ item: Nomination }>(
        `/api/src/nominations/${item.id}`,
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
          <h3 className="text-base font-bold">{item.nomineeName}</h3>
          <p className="text-sm text-muted-foreground">
            {item.position} · {item.clubName}
          </p>
          <p className="text-xs text-muted-foreground">
            Nominated by {item.submittedByName} ·{" "}
            {new Date(item.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
          </p>
        </div>
        <StatusPill status={item.status} />
      </div>
      {item.statement && <p className="mt-2 text-sm">{item.statement}</p>}
      {item.nomineeEmail && (
        <p className="mt-1 text-xs text-muted-foreground">Contact: {item.nomineeEmail}</p>
      )}
      {item.status === "pending" ? (
        <div className="mt-3 space-y-3">
          <Field label="Decision note" id={`nom-note-${item.id}`}>
            <Textarea id={`nom-note-${item.id}`} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} rows={2} />
          </Field>
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => decide("approved")} disabled={busy}>
              {busy ? "Saving…" : "Approve"}
            </Button>
            <Button variant="danger" onClick={() => decide("rejected")} disabled={busy}>
              Reject
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

function AppointmentForm({ onCreated }: { onCreated: (a: Appointment) => void }) {
  const [form, setForm] = useState({
    scopeType: "src",
    scopeName: "SRC",
    position: "",
    appointeeName: "",
    appointeeUserId: "",
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { item } = await adminFetch<{ item: Appointment }>("/api/src/appointments", {
        method: "POST",
        body: JSON.stringify({
          scopeType: form.scopeType,
          scopeId: "",
          scopeName: form.scopeName,
          position: form.position,
          appointeeName: form.appointeeName,
          appointeeUserId: form.appointeeUserId,
          startsAt: new Date(form.startsAt || Date.now()).toISOString(),
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        }),
      });
      onCreated(item);
      setForm((f) => ({ ...f, position: "", appointeeName: "", appointeeUserId: "", endsAt: "" }));
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "The appointment could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <h2 className="text-base font-bold">Direct appointment</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Appoint SRC officers, committee chairs or, where authorised, club executives.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Scope" id="appt-scope">
          <Select id="appt-scope" value={form.scopeType} onChange={set("scopeType")}>
            <option value="src">SRC</option>
            <option value="club">Club</option>
          </Select>
        </Field>
        <Field label={form.scopeType === "src" ? "Body / committee" : "Club name"} id="appt-scope-name">
          <Input id="appt-scope-name" value={form.scopeName} maxLength={120} onChange={set("scopeName")} />
        </Field>
        <Field label="Position" id="appt-position">
          <Input id="appt-position" value={form.position} maxLength={80} onChange={set("position")} placeholder="Electoral Commissioner" />
        </Field>
        <Field label="Appointee name" id="appt-name">
          <Input id="appt-name" value={form.appointeeName} maxLength={120} onChange={set("appointeeName")} />
        </Field>
        <Field label="Start date" id="appt-start">
          <Input id="appt-start" type="date" value={form.startsAt} onChange={set("startsAt")} />
        </Field>
        <Field label="End date (optional)" id="appt-end">
          <Input id="appt-end" type="date" value={form.endsAt} onChange={set("endsAt")} />
        </Field>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{error}</p>}
      <Button className="mt-3" onClick={submit} disabled={busy}>
        {busy ? "Saving…" : "Record appointment"}
      </Button>
    </Card>
  );
}

function AppointmentRow({ item, onRevoked }: { item: Appointment; onRevoked: (a: Appointment) => void }) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revoke = async () => {
    setBusy(true);
    setError(null);
    try {
      const { item: next } = await adminFetch<{ item: Appointment }>(
        `/api/src/appointments/${item.id}`,
        { method: "PATCH", body: JSON.stringify({ reason }) },
      );
      onRevoked(next);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "The appointment could not be revoked.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className="rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{item.appointeeName}</p>
          <p className="text-sm text-muted-foreground">{item.position} · {item.scopeName}</p>
          <p className="text-xs text-muted-foreground">
            From {new Date(item.startsAt).toLocaleDateString("en-GH")}
            {item.endsAt ? ` to ${new Date(item.endsAt).toLocaleDateString("en-GH")}` : " · no end date"}
          </p>
        </div>
        <StatusPill status={item.status} />
      </div>
      {item.status === "active" && !open && (
        <Button variant="ghost" className="mt-2" onClick={() => setOpen(true)}>
          Revoke appointment
        </Button>
      )}
      {item.status === "active" && open && (
        <div className="mt-3 space-y-2">
          <Field label="Reason for revocation (recorded)" id={`revoke-${item.id}`}>
            <Textarea id={`revoke-${item.id}`} value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} rows={2} />
          </Field>
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button variant="danger" onClick={revoke} disabled={busy}>
              {busy ? "Revoking…" : "Confirm revocation"}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {item.status === "revoked" && item.revokeReason && (
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold">Reason: </span>
          {item.revokeReason}
        </p>
      )}
    </li>
  );
}

export function SrcAppointments() {
  const nominations = useCollection<Nomination>("/api/src/nominations");
  const appointments = useCollection<Appointment>("/api/src/appointments");
  const pending = nominations.items.filter((n) => n.status === "pending");
  const decided = nominations.items.filter((n) => n.status !== "pending");
  if (nominations.loading || appointments.loading)
    return (
      <div className="space-y-6">
        <PageHeader title="Appointments" description="Review nominations and manage appointments." />
        <LoadingFeed />
      </div>
    );
  if (nominations.error || appointments.error)
    return (
      <div className="space-y-6">
        <PageHeader title="Appointments" description="Review nominations and manage appointments." />
        <ErrorState
          title="Appointments could not load"
          description={nominations.error ?? appointments.error ?? "Please retry."}
          onRetry={() => {
            nominations.reload();
            appointments.reload();
          }}
        />
      </div>
    );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Review executive and committee nominations, record direct appointments, and revoke with a recorded reason."
      />
      <Tabs
        label="Appointments sections"
        defaultValue="nominations"
        tabs={[
          {
            value: "nominations",
            label: `Nominations (${pending.length} pending)`,
            content: (
              <div className="space-y-3 pt-4">
                {pending.length === 0 && decided.length === 0 ? (
                  <EmptyState title="No nominations yet" description="Club and committee nominations submitted for SRC review will appear here." />
                ) : (
                  <>
                    {pending.map((n) => (
                      <NominationCard
                        key={n.id}
                        item={n}
                        onDecided={(next) =>
                          nominations.setItems(nominations.items.map((i) => (i.id === next.id ? next : i)))
                        }
                      />
                    ))}
                    {decided.map((n) => (
                      <NominationCard
                        key={n.id}
                        item={n}
                        onDecided={(next) =>
                          nominations.setItems(nominations.items.map((i) => (i.id === next.id ? next : i)))
                        }
                      />
                    ))}
                  </>
                )}
              </div>
            ),
          },
          {
            value: "appointments",
            label: `Appointments (${appointments.items.filter((a) => a.status === "active").length} active)`,
            content: (
              <div className="space-y-4 pt-4">
                <AppointmentForm
                  onCreated={(item) => appointments.setItems([item, ...appointments.items])}
                />
                {appointments.items.length === 0 ? (
                  <EmptyState title="No appointments recorded" description="Direct appointments made here are listed with their tenure." />
                ) : (
                  <ul className="space-y-3">
                    {appointments.items.map((a) => (
                      <AppointmentRow
                        key={a.id}
                        item={a}
                        onRevoked={(next) =>
                          appointments.setItems(appointments.items.map((i) => (i.id === next.id ? next : i)))
                        }
                      />
                    ))}
                  </ul>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
