import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import type { Club, ClubMembership } from "@/types";

interface ClubCardProps {
  club: Club;
  membership?: ClubMembership;
  onRequestJoin: () => void;
  canRequest: boolean;
}

export function ClubCard({ club, membership, onRequestJoin, canRequest }: ClubCardProps) {
  return (
    <Card>
      <p className="text-xs uppercase text-slate-500">{club.category}</p>
      <h2 className="mt-1 text-lg font-semibold">{club.name}</h2>
      <p className="mt-2 text-sm text-slate-600">{club.description}</p>
      {membership ? (
        <Badge tone={membership.status === "approved" ? "success" : membership.status === "rejected" ? "danger" : "warning"} className="mt-3">
          Membership: {membership.status}
        </Badge>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/clubs/${club.id}`}>
          <Button size="sm" variant="secondary">View club</Button>
        </Link>
        {canRequest ? (
          <Button size="sm" onClick={onRequestJoin}>Request to join</Button>
        ) : null}
      </div>
    </Card>
  );
}
