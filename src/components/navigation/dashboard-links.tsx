"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Landmark, ShieldCheck } from "lucide-react";

interface SessionPayload {
  user: { permissions?: string[] } | null;
}

function hasAny(permissions: string[] | undefined, prefix: string): boolean {
  return (permissions ?? []).some((p) => p === prefix || p.startsWith(`${prefix}.`));
}

export function DashboardLinks() {
  const [links, setLinks] = useState<{ src: boolean; admin: boolean } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { headers: { Accept: "application/json" }, credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload: SessionPayload | null) => {
        if (cancelled) return;
        const permissions = payload?.user?.permissions;
        const admin =
          hasAny(permissions, "platform") ||
          (permissions ?? []).some((p) => p.startsWith("platform."));
        const src =
          admin ||
          (permissions ?? []).some((p) => p.startsWith("src.") || p === "events.manage" || p === "announcements.publish");
        setLinks(permissions ? { src, admin } : { src: false, admin: false });
      })
      .catch(() => {
        if (!cancelled) setLinks({ src: false, admin: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);
  if (!links || (!links.src && !links.admin)) return null;
  return (
    <>
      {links.src && (
        <Link
          prefetch={false}
          href="/src"
          aria-label="Open SRC dashboard"
          title="SRC dashboard"
          className="grid size-11 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <Landmark className="size-5" aria-hidden="true" />
        </Link>
      )}
      {links.admin && (
        <Link
          prefetch={false}
          href="/admin"
          aria-label="Open Super Admin dashboard"
          title="Super Admin dashboard"
          className="grid size-11 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <ShieldCheck className="size-5" aria-hidden="true" />
        </Link>
      )}
    </>
  );
}
