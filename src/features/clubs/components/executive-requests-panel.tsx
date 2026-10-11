import { Badge, Button, Card } from "@/components/ui";
import { clubActionService } from "@/services";
import type { Club, ClubMembership } from "@/types";
interface Props {
  pendingRequests: ClubMembership[];
  clubs: Club[];
  busy?: boolean;
  onReview: (id: string, status: "approved" | "rejected") => void;
}
export function ExecutiveRequestsPanel({ pendingRequests, clubs, onReview, busy }: Props) {
  return (
    <Card id="executive-reviews" className="space-y-5">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-brand uppercase">
          Your community desk
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold">
          {clubActionService.source === "demo"
            ? "Club executive demo panel"
            : "Club executive reviews"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {clubActionService.source === "demo"
            ? "Review pending membership requests (demo only). Decisions are stored locally, not official club approvals."
            : "Review the membership requests provided by your connected service."}
        </p>
      </div>
      <div className="space-y-3">
        {pendingRequests.length ? (
          pendingRequests.map((membership) => (
            <div
              key={membership.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-card border border-border bg-surface-muted p-4"
              role="group"
              aria-label={`Membership request for ${clubs.find((club) => club.id === membership.clubId)?.name ?? membership.clubId}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {clubs.find((club) => club.id === membership.clubId)?.name ??
                    `Unloaded club ${membership.clubId}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {membership.applicantName ??
                    (clubActionService.source === "demo"
                      ? `Demo student ${membership.userId}`
                      : "Applicant name not supplied")}
                  {membership.requestedAt ? ` · ${membership.requestedAt}` : ""}
                </p>
                {membership.note ? (
                  <p className="mt-2 break-words text-sm leading-relaxed">{membership.note}</p>
                ) : null}
                <Badge className="mt-2" tone="warning">
                  Pending review
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => onReview(membership.id, "approved")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busy}
                  onClick={() => onReview(membership.id, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-control bg-surface-muted p-4 text-sm text-muted-foreground">
            No pending requests right now.
          </p>
        )}
      </div>
    </Card>
  );
}
