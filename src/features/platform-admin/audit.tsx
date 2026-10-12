"use client";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingFeed } from "@/components/shared/loading-feed";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { useObject } from "@/features/admin/api";
import type { AuditEntry } from "@/server/types";

interface AuditPage {
  items: AuditEntry[];
  page: number;
  pageSize: number;
  total: number;
}

export function AdminAudit() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useObject<AuditPage>(
    `/api/admin/audit?page=${page}&pageSize=30${submitted ? `&q=${encodeURIComponent(submitted)}` : ""}`,
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Append-only history of sign-ins, decisions, publications and admin changes."
      />
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSubmitted(query);
        }}
      >
        <SearchInput
          placeholder="Search audit log: action, target or detail…"
          value={query}
          onChange={setQuery}
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      {loading ? (
        <LoadingFeed />
      ) : error || !data ? (
        <ErrorState title="Audit log could not load" description={error ?? "Please retry."} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <EmptyState title="No entries found" description="Actions across the dashboards are recorded here automatically." />
      ) : (
        <>
          <ol className="space-y-2">
            {data.items.map((entry) => (
              <li key={entry.id} className="rounded-card border border-border bg-surface p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-bold">{entry.action}</span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(entry.at).toLocaleString("en-GH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </time>
                </div>
                <p className="mt-0.5 text-muted-foreground">
                  {entry.detail || `${entry.targetType} · ${entry.targetId.slice(0, 24)}`}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Actor {entry.actorId ? entry.actorId.slice(0, 14) + "…" : "system"}
                  {entry.ip ? ` · ${entry.ip}` : ""}
                </p>
              </li>
            ))}
          </ol>
          {pages > 1 && (
            <Pagination page={data.page} totalPages={pages} onPageChange={setPage} label="Audit log pages" />
          )}
        </>
      )}
    </div>
  );
}
