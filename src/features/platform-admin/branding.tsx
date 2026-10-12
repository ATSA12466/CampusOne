"use client";
import { useState } from "react";
import Image from "next/image";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingFeed } from "@/components/shared/loading-feed";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { adminFetch, AdminApiError, useObject } from "@/features/admin/api";
import type { Branding, BrandVersion } from "@/server/admin";

interface BrandingBundle {
  published: Branding;
  draft: Branding;
  versions: BrandVersion[];
}

const assetSlots = [
  { kind: "logoLight", label: "Light-mode logo", hint: "Header on light surfaces" },
  { kind: "logoDark", label: "Dark-mode logo", hint: "Header on dark surfaces" },
  { kind: "logoLogin", label: "Login & onboarding logo", hint: "Auth screens" },
  { kind: "appIcon", label: "Application icon", hint: "Install prompt & task switcher" },
  { kind: "favicon", label: "Browser favicon", hint: "Browser tab (ICO or PNG)" },
  { kind: "pwaIcon", label: "PWA icon", hint: "Installed app icon, 512px PNG ideal" },
  { kind: "bannerDefault", label: "Default banner", hint: "Fallback cover imagery" },
] as const;

type AssetKind = (typeof assetSlots)[number]["kind"];

function AssetSlot({
  kind,
  label,
  hint,
  value,
  onUploaded,
}: {
  kind: AssetKind;
  label: string;
  hint: string;
  value: string;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("kind", kind);
      form.append("file", file);
      const response = await fetch("/api/admin/branding/assets", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const payload = (await response.json()) as { item?: { url: string }; error?: string };
      if (!response.ok || !payload.item) throw new Error(payload.error ?? "Upload failed.");
      onUploaded(payload.item.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="text-sm font-bold">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="mt-2 flex h-20 items-center justify-center overflow-hidden rounded-control bg-surface-muted">
        {value ? (
          // Plain img: remote admin-uploaded bytes are unoptimized by design.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={`${label} preview`} className="max-h-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">No asset — built-in default in use</span>
        )}
      </div>
      <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-control border border-border px-3.5 text-sm font-semibold hover:bg-surface-muted">
        {busy ? "Uploading…" : value ? "Replace" : "Upload"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {value && (
        <Button variant="ghost" size="sm" className="ml-2" onClick={() => onUploaded("")}>
          Remove
        </Button>
      )}
      {error && <p role="alert" className="mt-1 text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}

function BrandingEditor({ bundle, onPublished }: { bundle: BrandingBundle; onPublished: () => void }) {
  const [draft, setDraft] = useState<Branding>(bundle.draft);
  const [busy, setBusy] = useState<"draft" | "publish" | string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const set = (key: keyof Branding) => (e: { target: { value: string } }) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));
  const setColor = (key: keyof Branding["colors"]) => (e: { target: { value: string } }) =>
    setDraft((d) => ({ ...d, colors: { ...d.colors, [key]: e.target.value } }));
  const saveDraft = async () => {
    setBusy("draft");
    setMessage(null);
    try {
      const { draft: saved } = await adminFetch<{ draft: Branding }>("/api/admin/branding", {
        method: "PUT",
        body: JSON.stringify(draft),
      });
      setDraft(saved);
      setMessage({ kind: "ok", text: "Draft saved. Nothing is live until you publish." });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof AdminApiError ? cause.message : "Draft could not be saved." });
    } finally {
      setBusy(null);
    }
  };
  const publish = async () => {
    if (!confirm("Publish this branding? Logos, names and colors update across the app.")) return;
    setBusy("publish");
    setMessage(null);
    try {
      await adminFetch("/api/admin/branding", { method: "POST", body: JSON.stringify({ action: "publish" }) });
      setMessage({ kind: "ok", text: "Published. Changes are live on supporting surfaces." });
      onPublished();
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof AdminApiError ? cause.message : "Publish failed." });
    } finally {
      setBusy(null);
    }
  };
  const rollback = async (versionId: string) => {
    if (!confirm("Restore this version? The current live branding becomes a previous version.")) return;
    setBusy(versionId);
    setMessage(null);
    try {
      await adminFetch("/api/admin/branding", { method: "POST", body: JSON.stringify({ action: "rollback", versionId }) });
      setMessage({ kind: "ok", text: "Version restored." });
      onPublished();
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof AdminApiError ? cause.message : "Restore failed." });
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Branding & appearance"
        description="Edit a draft, preview it here, then publish. Every publish is versioned and attributable."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={saveDraft} disabled={busy !== null}>
              {busy === "draft" ? "Saving…" : "Save draft"}
            </Button>
            <Button variant="gold" onClick={publish} disabled={busy !== null}>
              {busy === "publish" ? "Publishing…" : "Publish"}
            </Button>
          </div>
        }
      />
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm font-semibold ${message.kind === "error" ? "text-danger" : "text-success"}`}>
          {message.text}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-bold">Identity</h2>
          <div className="mt-3 space-y-3">
            <Field label="Display name" id="brand-name">
              <Input id="brand-name" value={draft.displayName} maxLength={60} onChange={set("displayName")} />
            </Field>
            <Field label="Tagline" id="brand-tagline">
              <Input id="brand-tagline" value={draft.tagline} maxLength={120} onChange={set("tagline")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {(["brand", "brandInk", "accent", "cream"] as const).map((color) => (
                <Field key={color} label={color} id={`brand-${color}`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      aria-label={`${color} picker`}
                      value={draft.colors[color]}
                      onChange={setColor(color)}
                      className="size-11 shrink-0 cursor-pointer rounded-control border border-border"
                    />
                    <Input id={`brand-${color}`} value={draft.colors[color]} maxLength={7} onChange={setColor(color)} />
                  </div>
                </Field>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-bold">Preview</h2>
          <p className="text-xs text-muted-foreground">How the draft identity reads in the app header.</p>
          <div className="mt-3 rounded-card border border-border p-4" style={{ background: draft.colors.cream }}>
            <div className="flex items-center gap-3">
              {draft.logoLight ? (
                <Image src={draft.logoLight} alt="Draft logo preview" width={40} height={40} className="rounded-control object-contain" unoptimized />
              ) : (
                <span className="grid size-10 place-items-center rounded-control font-display text-lg font-bold text-white" style={{ background: draft.colors.brand }}>
                  {draft.displayName.slice(0, 1)}
                </span>
              )}
              <div>
                <p className="font-bold" style={{ color: draft.colors.brandInk }}>{draft.displayName}</p>
                <p className="text-xs text-muted-foreground">{draft.tagline}</p>
              </div>
              <span className="ml-auto rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: draft.colors.accent, color: "#3d2a00" }}>
                Badge
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Published logos appear in the app header, auth screens and install icons on supporting
            surfaces. Already-installed apps and cached favicons update on reinstall or cache expiry.
          </p>
        </Card>
      </div>
      <section aria-labelledby="brand-assets" className="space-y-3">
        <h2 id="brand-assets" className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
          Assets (PNG, JPEG, WebP, SVG, ICO · validated on upload)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assetSlots.map((slot) => (
            <AssetSlot
              key={slot.kind}
              kind={slot.kind}
              label={slot.label}
              hint={slot.hint}
              value={draft[slot.kind] as string}
              onUploaded={(url) => setDraft((d) => ({ ...d, [slot.kind]: url }))}
            />
          ))}
        </div>
      </section>
      <section aria-labelledby="brand-history" className="space-y-2">
        <h2 id="brand-history" className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
          Version history ({bundle.versions.length})
        </h2>
        {bundle.versions.length === 0 ? (
          <EmptyState title="No published versions yet" description="The first publish creates a restorable version." />
        ) : (
          <ul className="space-y-2">
            {bundle.versions.map((version, index) => (
              <li key={version.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-surface p-3 text-sm">
                <span>
                  <span className="font-bold">{version.snapshot.displayName}</span>{" "}
                  <span className="text-muted-foreground">
                    by {version.publishedByName} · {new Date(version.publishedAt).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {index === 0 ? " · current" : ""}
                  </span>
                </span>
                {index !== 0 && (
                  <Button variant="secondary" size="sm" onClick={() => rollback(version.id)} disabled={busy !== null}>
                    {busy === version.id ? "Restoring…" : "Restore"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function AdminBranding() {
  const { data, loading, error, reload } = useObject<BrandingBundle>("/api/admin/branding");
  if (loading)
    return (
      <div className="space-y-6">
        <PageHeader title="Branding & appearance" description="Logos, icons, names and colors." />
        <LoadingFeed />
      </div>
    );
  if (error || !data)
    return (
      <div className="space-y-6">
        <PageHeader title="Branding & appearance" description="Logos, icons, names and colors." />
        <ErrorState title="Branding could not load" description={error ?? "Please retry."} onRetry={reload} />
      </div>
    );
  return (
    <BrandingEditor
      key={`${data.published.updatedAt}-${data.draft.updatedAt}`}
      bundle={data}
      onPublished={reload}
    />
  );
}
