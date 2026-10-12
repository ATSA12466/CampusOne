"use client";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingFeed } from "@/components/shared/loading-feed";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { adminFetch, useCollection, AdminApiError } from "@/features/admin/api";
import { StatusPill } from "@/features/admin/components/status-pill";
import type { PlatformRole } from "@/server/types";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  roles: PlatformRole[];
  programme: string;
  level: string;
  status: "active" | "suspended";
  verifiedStudent: boolean;
  createdAt: string;
}

const editableRoles: PlatformRole[] = [
  "student",
  "verified-student",
  "club-member",
  "club-executive",
  "club-president",
  "committee-member",
  "src-representative",
  "src-executive",
  "src-admin",
  "moderator",
  "vendor",
  "administrator",
  "super-admin",
];

function UserRow({ user, onSaved }: { user: AdminUser; onSaved: (u: AdminUser) => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(user.status);
  const [verified, setVerified] = useState(user.verifiedStudent);
  const [roles, setRoles] = useState<PlatformRole[]>(user.roles);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toggleRole = (role: PlatformRole) =>
    setRoles((r) => (r.includes(role) ? r.filter((x) => x !== role) : [...r, role]));
  const save = async () => {
    if (roles.length === 0) {
      setError("Every account needs at least one role.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { item } = await adminFetch<{ item: AdminUser }>(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, verifiedStudent: verified, roles }),
      });
      onSaved(item);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "The account could not be updated.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className="rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {user.programme || "No programme"} {user.level ? `· Level ${user.level}` : ""} · Joined{" "}
            {new Date(user.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <Badge key={role} tone="primary">{role}</Badge>
            ))}
            {user.verifiedStudent && <Badge tone="success">verified</Badge>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill status={user.status === "active" ? "active" : "revoked"} />
          <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? "Close" : "Manage"}
          </Button>
        </div>
      </div>
      {open && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Account status" id={`status-${user.id}`}>
              <Select id={`status-${user.id}`} value={status} onChange={(e) => setStatus(e.target.value as AdminUser["status"])}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </Select>
            </Field>
            <Field label="Student verification" id={`verified-${user.id}`}>
              <Select id={`verified-${user.id}`} value={verified ? "yes" : "no"} onChange={(e) => setVerified(e.target.value === "yes")}>
                <option value="yes">Verified student</option>
                <option value="no">Not verified</option>
              </Select>
            </Field>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Roles</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {editableRoles.map((role) => (
                <label key={role} className="inline-flex cursor-pointer items-center gap-2 rounded-control border border-border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={roles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="size-4 accent-(--brand)"
                  />
                  {role}
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      )}
    </li>
  );
}

export function AdminUsers() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { items, loading, error, reload, setItems } = useCollection<AdminUser>(
    `/api/admin/users${submitted ? `?q=${encodeURIComponent(submitted)}` : ""}`,
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Search accounts, verify students, suspend abuse and adjust roles. Role edits need the roles permission."
      />
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query);
        }}
      >
        <SearchInput
          placeholder="Search users: name, email or role…"
          value={query}
          onChange={setQuery}
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      {loading ? (
        <LoadingFeed />
      ) : error ? (
        <ErrorState title="Users could not load" description={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState title="No accounts found" description="Try a different search, or invite students to register." />
      ) : (
        <ul className="space-y-3">
          {items.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onSaved={(next) => setItems(items.map((i) => (i.id === next.id ? next : i)))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
