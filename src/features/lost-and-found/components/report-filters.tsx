"use client";
import { Input, Select } from "@/components/ui";
export function ReportFilters({
  query,
  setQuery,
  kind,
  setKind,
  view,
  setView,
  setPage,
}: {
  query: string;
  setQuery: (v: string) => void;
  kind: string;
  setKind: (v: string) => void;
  view: "all" | "saved";
  setView: (v: "all" | "saved") => void;
  setPage: (v: number) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-xs font-medium">
        Search reports
        <Input
          type="search"
          value={query}
          maxLength={120}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </label>
      <label className="text-xs font-medium">
        Report type
        <Select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Lost and found</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </Select>
      </label>
      <label className="text-xs font-medium">
        Report view
        <Select
          value={view}
          onChange={(e) => {
            setView(e.target.value === "saved" ? "saved" : "all");
            setPage(1);
          }}
        >
          <option value="all">All loaded reports</option>
          <option value="saved">Saved</option>
        </Select>
      </label>
    </div>
  );
}
