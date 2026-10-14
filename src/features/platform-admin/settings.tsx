"use client";
import { useState } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingFeed } from "@/components/shared/loading-feed";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminFetch, AdminApiError, useObject } from "@/features/admin/api";

interface SettingsBundle {
  settings: Record<string, string>;
  known: readonly string[];
}

const meta: Record<string, { label: string; hint: string; multiline?: boolean }> = {
  supportEmail: { label: "Support email", hint: "Shown on help and error surfaces." },
  maintenanceMessage: {
    label: "Maintenance message",
    hint: "Leave empty for normal operation. When set, a banner is shown across the app.",
    multiline: true,
  },
  announcementBanner: {
    label: "Platform banner",
    hint: "Short notice shown to every signed-in user. Leave empty to hide.",
    multiline: true,
  },
};

function SettingsEditor({ bundle }: { bundle: SettingsBundle }) {
  const [values, setValues] = useState<Record<string, string>>(bundle.settings);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const save = async (key: string) => {
    setBusy(key);
    setMessage(null);
    try {
      const { settings } = await adminFetch<{ settings: Record<string, string> }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ key, value: values[key] ?? "" }),
      });
      setValues(settings);
      setMessage({ kind: "ok", text: `${meta[key]?.label ?? key} saved.` });
    } catch (cause) {
      setMessage({ kind: "error", text: cause instanceof AdminApiError ? cause.message : "Setting could not be saved." });
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform settings"
        description="Support contact, banners and maintenance messaging. Changes apply immediately."
      />
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm font-semibold ${message.kind === "error" ? "text-danger" : "text-success"}`}>
          {message.text}
        </p>
      )}
      <div className="grid gap-4">
        {bundle.known.map((key) => (
          <Card key={key}>
            <Field label={meta[key]?.label ?? key} id={`setting-${key}`} hint={meta[key]?.hint}>
              {meta[key]?.multiline ? (
                <Textarea
                  id={`setting-${key}`}
                  value={values[key] ?? ""}
                  maxLength={2000}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  rows={2}
                />
              ) : (
                <Input
                  id={`setting-${key}`}
                  value={values[key] ?? ""}
                  maxLength={2000}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                />
              )}
            </Field>
            <Button className="mt-3" variant="secondary" onClick={() => save(key)} disabled={busy !== null}>
              {busy === key ? "Saving…" : "Save"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AdminSettings() {
  const { data, loading, error, reload } = useObject<SettingsBundle>("/api/admin/settings");
  if (loading)
    return (
      <div className="space-y-6">
        <PageHeader title="Platform settings" description="Support contact, banners and maintenance messaging." />
        <LoadingFeed />
      </div>
    );
  if (error || !data)
    return (
      <div className="space-y-6">
        <PageHeader title="Platform settings" description="Support contact, banners and maintenance messaging." />
        <ErrorState title="Settings could not load" description={error ?? "Please retry."} onRetry={reload} />
      </div>
    );
  return <SettingsEditor bundle={data} />;
}
