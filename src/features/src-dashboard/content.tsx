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
import type { Announcement, SrcProfile } from "@/server/registry";

function AnnouncementForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Announcement;
  onSaved: (a: Announcement) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    body: initial?.body ?? "",
    audience: initial?.audience ?? "all",
    status: initial?.status ?? "draft",
    expireAt: initial?.expireAt ? initial.expireAt.slice(0, 10) : "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        audience: form.audience,
        status: form.status,
        publishAt: form.status === "published" ? new Date().toISOString() : null,
        expireAt: form.expireAt ? new Date(form.expireAt).toISOString() : null,
      };
      const { item } = initial
        ? await adminFetch<{ item: Announcement }>(`/api/src/announcements/${initial.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await adminFetch<{ item: Announcement }>("/api/src/announcements", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      onSaved(item);
      if (!initial) setForm({ title: "", body: "", audience: "all", status: "draft", expireAt: "" });
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "The announcement could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <h2 className="text-base font-bold">{initial ? "Edit announcement" : "New announcement"}</h2>
      <div className="mt-3 space-y-3">
        <Field label="Title" id={initial ? `ann-title-${initial.id}` : "ann-title"}>
          <Input
            id={initial ? `ann-title-${initial.id}` : "ann-title"}
            value={form.title}
            maxLength={160}
            onChange={set("title")}
            placeholder="Orientation week: what every fresher should know"
          />
        </Field>
        <Field label="Message" id={initial ? `ann-body-${initial.id}` : "ann-body"}>
          <Textarea
            id={initial ? `ann-body-${initial.id}` : "ann-body"}
            value={form.body}
            maxLength={5000}
            onChange={set("body")}
            rows={5}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Audience" id={initial ? `ann-aud-${initial.id}` : "ann-aud"}>
            <Select id={initial ? `ann-aud-${initial.id}` : "ann-aud"} value={form.audience} onChange={set("audience")}>
              <option value="all">Everyone</option>
              <option value="freshers">Freshers</option>
              <option value="clubs">Club members</option>
              <option value="src">SRC team</option>
            </Select>
          </Field>
          <Field label="Status" id={initial ? `ann-status-${initial.id}` : "ann-status"}>
            <Select id={initial ? `ann-status-${initial.id}` : "ann-status"} value={form.status} onChange={set("status")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="expired">Expired</option>
            </Select>
          </Field>
          <Field label="Expiry date (optional)" id={initial ? `ann-exp-${initial.id}` : "ann-exp"}>
            <Input id={initial ? `ann-exp-${initial.id}` : "ann-exp"} type="date" value={form.expireAt} onChange={set("expireAt")} />
          </Field>
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "Save announcement"}
          </Button>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function AnnouncementsTab() {
  const { items, loading, error, reload, setItems } = useCollection<Announcement>("/api/src/announcements");
  const [editing, setEditing] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const remove = async (id: string) => {
    if (!confirm("Delete this announcement? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await adminFetch(`/api/src/announcements/${id}`, { method: "DELETE" });
      setItems(items.filter((i) => i.id !== id));
    } catch {
      setBusyId(null);
    }
  };
  if (loading) return <LoadingFeed />;
  if (error) return <ErrorState title="Announcements could not load" description={error} onRetry={reload} />;
  return (
    <div className="space-y-4 pt-4">
      <AnnouncementForm onSaved={(item) => setItems([item, ...items.filter((i) => i.id !== item.id)])} />
      {items.length === 0 ? (
        <EmptyState title="No announcements yet" description="Drafts and published announcements will be listed here." />
      ) : (
        items.map((item) =>
          editing === item.id ? (
            <AnnouncementForm
              key={item.id}
              initial={item}
              onSaved={(next) => {
                setItems(items.map((i) => (i.id === next.id ? next : i)));
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    By {item.authorName} · Audience: {item.audience} · Updated{" "}
                    {new Date(item.updatedAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <StatusPill status={item.status} />
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.body}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(item.id)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => remove(item.id)} disabled={busyId === item.id}>
                  {busyId === item.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </Card>
          ),
        )
      )}
    </div>
  );
}

function ProfileForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: SrcProfile;
  onSaved: (p: SrcProfile) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    position: initial?.position ?? "",
    bio: initial?.bio ?? "",
    email: initial?.email ?? "",
    order: String(initial?.order ?? 10),
    active: initial?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        position: form.position,
        bio: form.bio,
        photoUrl: initial?.photoUrl ?? "",
        email: form.email,
        order: Math.max(0, Math.min(100, Number(form.order) || 0)),
        active: form.active,
      };
      const { item } = initial
        ? await adminFetch<{ item: SrcProfile }>(`/api/src/profiles/${initial.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await adminFetch<{ item: SrcProfile }>("/api/src/profiles", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      onSaved(item);
      if (!initial) setForm({ name: "", position: "", bio: "", email: "", order: "10", active: true });
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "The profile could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  const id = initial ? initial.id : "new";
  return (
    <Card>
      <h2 className="text-base font-bold">{initial ? `Edit ${initial.name}` : "Add executive profile"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Never enter a real person&apos;s details without authorisation. Photographs are uploaded by
        Super Admin through branding/media management.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Full name" id={`prof-name-${id}`}>
          <Input id={`prof-name-${id}`} value={form.name} maxLength={120} onChange={set("name")} />
        </Field>
        <Field label="Position" id={`prof-pos-${id}`}>
          <Input id={`prof-pos-${id}`} value={form.position} maxLength={120} onChange={set("position")} placeholder="SRC President" />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Biography" id={`prof-bio-${id}`}>
          <Textarea id={`prof-bio-${id}`} value={form.bio} maxLength={2000} onChange={set("bio")} rows={3} />
        </Field>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Contact email (optional)" id={`prof-email-${id}`}>
          <Input id={`prof-email-${id}`} value={form.email} maxLength={254} onChange={set("email")} />
        </Field>
        <Field label="Display order" id={`prof-order-${id}`}>
          <Input id={`prof-order-${id}`} type="number" min={0} max={100} value={form.order} onChange={set("order")} />
        </Field>
        <Field label="Visibility" id={`prof-active-${id}`}>
          <Select
            id={`prof-active-${id}`}
            value={form.active ? "active" : "hidden"}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "active" }))}
          >
            <option value="active">Visible</option>
            <option value="hidden">Hidden</option>
          </Select>
        </Field>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Saving…" : initial ? "Save changes" : "Add profile"}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}

function ProfilesTab() {
  const { items, loading, error, reload, setItems } = useCollection<SrcProfile>("/api/src/profiles");
  const [editing, setEditing] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const remove = async (id: string) => {
    if (!confirm("Remove this executive profile? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await adminFetch(`/api/src/profiles/${id}`, { method: "DELETE" });
      setItems(items.filter((i) => i.id !== id));
    } finally {
      setBusyId(null);
    }
  };
  if (loading) return <LoadingFeed />;
  if (error) return <ErrorState title="Profiles could not load" description={error} onRetry={reload} />;
  return (
    <div className="space-y-4 pt-4">
      <ProfileForm onSaved={(item) => setItems([...items.filter((i) => i.id !== item.id), item])} />
      {items.length === 0 ? (
        <EmptyState title="No executive profiles yet" description="Add the current SRC executives so students know their representatives." />
      ) : (
        items.map((item) =>
          editing === item.id ? (
            <ProfileForm
              key={item.id}
              initial={item}
              onSaved={(next) => {
                setItems(items.map((i) => (i.id === next.id ? next : i)));
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold">{item.name}</h3>
                  <p className="text-sm text-brand">{item.position}</p>
                  {item.bio && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.bio}</p>}
                </div>
                <StatusPill status={item.active ? "published" : "draft"} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(item.id)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => remove(item.id)} disabled={busyId === item.id}>
                  {busyId === item.id ? "Removing…" : "Remove"}
                </Button>
              </div>
            </Card>
          ),
        )
      )}
    </div>
  );
}

export function SrcContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        description="Publish announcements with audiences and expiry, and maintain the SRC office profiles students see."
      />
      <Tabs
        label="Content sections"
        defaultValue="announcements"
        tabs={[
          { value: "announcements", label: "Announcements", content: <AnnouncementsTab /> },
          { value: "profiles", label: "Office profiles", content: <ProfilesTab /> },
        ]}
      />
    </div>
  );
}
