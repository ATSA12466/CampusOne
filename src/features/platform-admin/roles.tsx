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
import { adminFetch, useCollection, AdminApiError } from "@/features/admin/api";
import type { Grant } from "@/server/permissions";

const allPermissions = [
  "club.members.view",
  "club.members.manage",
  "club.events.manage",
  "club.attendance.manage",
  "club.badges.manage",
  "club.resources.manage",
  "src.appointments.review",
  "src.clubs.review",
  "src.content.publish",
  "src.requests.manage",
  "academic.materials.manage",
  "accommodation.listings.review",
  "accommodation.listings.manage",
  "marketplace.moderate",
  "community.moderate",
  "platform.users.manage",
  "platform.roles.manage",
  "platform.branding.manage",
  "platform.settings.manage",
  "platform.audit.view",
  "events.manage",
  "announcements.publish",
  "messages.moderate",
];

function GrantForm({ onCreated }: { onCreated: (g: Grant) => void }) {
  const [form, setForm] = useState({
    userId: "",
    permission: "club.members.manage",
    scopeType: "club",
    scopeId: "",
    expiresAt: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { item } = await adminFetch<{ item: Grant }>("/api/admin/grants", {
        method: "POST",
        body: JSON.stringify({
          userId: form.userId.trim(),
          permission: form.permission,
          scopeType: form.scopeType,
          scopeId: form.scopeId.trim() || null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });
      onCreated(item);
      setForm({ userId: "", permission: "club.members.manage", scopeType: "club", scopeId: "", expiresAt: "" });
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "The grant could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <h2 className="text-base font-bold">New scoped grant</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Give one person one permission in one place — e.g. manage members of a single club.
        Find the user id on the Users page (hover or copy from the account record).
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="User id" id="grant-user">
          <Input id="grant-user" value={form.userId} onChange={set("userId")} placeholder="u_…" />
        </Field>
        <Field label="Permission" id="grant-perm">
          <Select id="grant-perm" value={form.permission} onChange={set("permission")}>
            {allPermissions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </Field>
        <Field label="Scope type" id="grant-scope-type">
          <Select id="grant-scope-type" value={form.scopeType} onChange={set("scopeType")}>
            <option value="club">Club</option>
            <option value="event">Event</option>
            <option value="user">User</option>
            <option value="global">Global</option>
          </Select>
        </Field>
        <Field label="Scope id (club id, event id…)" id="grant-scope-id">
          <Input id="grant-scope-id" value={form.scopeId} onChange={set("scopeId")} placeholder="club-tech-1" />
        </Field>
        <Field label="Expires (optional)" id="grant-exp">
          <Input id="grant-exp" type="date" value={form.expiresAt} onChange={set("expiresAt")} />
        </Field>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{error}</p>}
      <Button className="mt-3" onClick={submit} disabled={busy}>
        {busy ? "Saving…" : "Create grant"}
      </Button>
    </Card>
  );
}

export function AdminRoles() {
  const { items, loading, error, reload, setItems } = useCollection<Grant>("/api/admin/grants");
  const [busyId, setBusyId] = useState<string | null>(null);
  const revoke = async (id: string) => {
    if (!confirm("Revoke this grant? Access is removed immediately.")) return;
    setBusyId(id);
    try {
      await adminFetch(`/api/admin/grants/${id}`, { method: "PATCH" });
      setItems(items.map((i) => (i.id === id ? { ...i, revokedAt: new Date().toISOString() } : i)));
    } finally {
      setBusyId(null);
    }
  };
  const active = items.filter((g) => !g.revokedAt);
  const revoked = items.filter((g) => g.revokedAt);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & scoped grants"
        description="Role baselines come from the permission map; these grants add precise, expirable, revocable access."
      />
      {loading ? (
        <LoadingFeed />
      ) : error ? (
        <ErrorState title="Grants could not load" description={error} onRetry={reload} />
      ) : (
        <>
          <GrantForm onCreated={(g) => setItems([g, ...items])} />
          <section aria-labelledby="active-grants" className="space-y-3">
            <h2 id="active-grants" className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Active ({active.length})
            </h2>
            {active.length === 0 ? (
              <EmptyState title="No active grants" description="Scoped access granted here will be listed with its expiry." />
            ) : (
              <ul className="space-y-2">
                {active.map((g) => (
                  <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-surface p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{g.permission}</p>
                      <p className="text-xs text-muted-foreground">
                        User {g.userId.slice(0, 14)}… · {g.scopeType}
                        {g.scopeId ? `:${g.scopeId}` : ""} · since {new Date(g.createdAt).toLocaleDateString("en-GH")}
                        {g.expiresAt ? ` · expires ${new Date(g.expiresAt).toLocaleDateString("en-GH")}` : " · no expiry"}
                      </p>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => revoke(g.id)} disabled={busyId === g.id}>
                      {busyId === g.id ? "Revoking…" : "Revoke"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {revoked.length > 0 && (
            <section aria-labelledby="revoked-grants" className="space-y-2">
              <h2 id="revoked-grants" className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
                Revoked ({revoked.length})
              </h2>
              <ul className="space-y-2">
                {revoked.map((g) => (
                  <li key={g.id} className="flex flex-wrap items-center gap-2 rounded-card border border-border bg-surface-muted/50 p-3 text-sm">
                    <Badge tone="neutral">revoked</Badge>
                    <span className="font-semibold">{g.permission}</span>
                    <span className="text-muted-foreground">{g.scopeType}{g.scopeId ? `:${g.scopeId}` : ""}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
