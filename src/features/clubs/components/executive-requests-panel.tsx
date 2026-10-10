import { Badge, Button, Card } from "@/components/ui";
import type { Club, ClubMembership } from "@/types";

interface ExecutiveRequestsPanelProps {
  pendingRequests: ClubMembership[];
  clubs: Club[];
  onReview: (membershipId: string, status: "approved" | "rejected") => void;
}

export function ExecutiveRequestsPanel({ pendingRequests, clubs, onReview }: ExecutiveRequestsPanelProps) {
  return (
    <Card>
      <h3 className="font-semibold">Club executive demo panel</h3>
      <p className="mt-1 text-sm text-slate-600">Review pending membership requests (demo only).</p>
      <div className="mt-3 space-y-2">
        {pendingRequests.length ? (
          pendingRequests.map((membership) => (
            <div key={membership.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] p-3">
              <div className="text-sm">
                <p className="font-medium">{clubs.find((club) => club.id === membership.clubId)?.name}</p>
                <Badge tone="warning" className="mt-1">Pending review</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onReview(membership.id, "approved")}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => onReview(membership.id, "rejected")}>Reject</Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No pending requests right now.</p>
        )}
      </div>
    </Card>
  );
}
