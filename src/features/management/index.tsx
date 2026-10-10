"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge, Card } from "@/components/ui";
import { useAuthStore } from "@/stores/auth-store";

export function ManagementFeature() {
  const role = useAuthStore((state) => state.role);

  const roleScopes: Record<string, string[]> = {
    student: ["Personal dashboard", "Task and participation tracking"],
    "club-executive": ["Membership reviews", "Activity and attendance management"],
    "committee-member": ["Committee assignments", "Programme support workflows"],
    "src-representative": ["Student request triage", "SRC project tracking"],
    administrator: ["Campaign configuration", "Cross-module oversight"],
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Management" description="Role-aware demo management workspace for operational modules." />
      <Card>
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Current role scope</h2>
          <Badge tone="primary">{role}</Badge>
        </div>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
          {roleScopes[role].map((scope) => (
            <li key={scope}>{scope}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">Role visibility is a frontend demo and must be enforced by backend authorization in production.</p>
      </Card>
    </div>
  );
}
