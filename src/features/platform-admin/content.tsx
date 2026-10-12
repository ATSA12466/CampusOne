"use client";
import Link from "next/link";
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
import type { Material } from "@/server/admin";

function MaterialForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Material;
  onSaved: (m: Material) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    course: initial?.course ?? "",
    kind: initial?.kind ?? "note",
    description: initial?.description ?? "",
    fileUrl: initial?.fileUrl ?? "",
    status: initial?.status ?? "draft",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { item } = initial
        ? await adminFetch<{ item: Material }>(`/api/admin/materials/${initial.id}`, {
            method: "PATCH",
            body: JSON.stringify(form),
          })
        : await adminFetch<{ item: Material }>("/api/admin/materials", {
            method: "POST",
            body: JSON.stringify(form),
          });
      onSaved(item);
      if (!initial) setForm({ title: "", course: "", kind: "note", description: "", fileUrl: "", status: "draft" });
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "The material could not be saved.");
    } finally {
      setBusy(false);
    }
  };
  const id = initial?.id ?? "new";
  return (
    <Card>
      <h2 className="text-base font-bold">{initial ? "Edit material" : "New course material"}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Title" id={`mat-title-${id}`}>
          <Input id={`mat-title-${id}`} value={form.title} maxLength={200} onChange={set("title")} placeholder="CS 201 — Data structures revision notes" />
        </Field>
        <Field label="Course" id={`mat-course-${id}`}>
          <Input id={`mat-course-${id}`} value={form.course} maxLength={120} onChange={set("course")} placeholder="CS 201" />
        </Field>
        <Field label="Kind" id={`mat-kind-${id}`}>
          <Select id={`mat-kind-${id}`} value={form.kind} onChange={set("kind")}>
            <option value="note">Note</option>
            <option value="past-question">Past question</option>
            <option value="slide">Slides</option>
            <option value="reading">Reading</option>
            <option value="video">Video</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Status" id={`mat-status-${id}`}>
          <Select id={`mat-status-${id}`} value={form.status} onChange={set("status")}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Description" id={`mat-desc-${id}`}>
          <Textarea id={`mat-desc-${id}`} value={form.description} maxLength={2000} onChange={set("description")} rows={3} />
        </Field>
      </div>
      <div className="mt-3">
        <Field label="File URL (authorised hosting)" id={`mat-url-${id}`} hint="Only link files the platform is authorised to share.">
          <Input id={`mat-url-${id}`} value={form.fileUrl} maxLength={1000} onChange={set("fileUrl")} placeholder="https://…" />
        </Field>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Saving…" : initial ? "Save changes" : "Add material"}
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

export function AdminContent() {
  const { items, loading, error, reload, setItems } = useCollection<Material>("/api/admin/materials");
  const [editing, setEditing] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const remove = async (id: string) => {
    if (!confirm("Delete this material? Students will lose access immediately.")) return;
    setBusyId(id);
    try {
      await adminFetch(`/api/admin/materials/${id}`, { method: "DELETE" });
      setItems(items.filter((i) => i.id !== id));
    } finally {
      setBusyId(null);
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        description="Curate approved course materials. Announcements and SRC profiles live in the SRC dashboard."
        actions={
          <Button asChild variant="secondary">
            <Link prefetch={false} href="/src/content">
              SRC content
            </Link>
          </Button>
        }
      />
      {loading ? (
        <LoadingFeed />
      ) : error ? (
        <ErrorState title="Materials could not load" description={error} onRetry={reload} />
      ) : (
        <div className="space-y-4">
          <MaterialForm onSaved={(item) => setItems([item, ...items.filter((i) => i.id !== item.id)])} />
          {items.length === 0 ? (
            <EmptyState title="No materials yet" description="Published materials appear in the student Academics section." />
          ) : (
            items.map((item) =>
              editing === item.id ? (
                <MaterialForm
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
                        {item.course} · by {item.authorName} · updated{" "}
                        {new Date(item.updatedAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="primary">{item.kind}</Badge>
                      <StatusPill status={item.status} />
                    </div>
                  </div>
                  {item.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
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
      )}
    </div>
  );
}
