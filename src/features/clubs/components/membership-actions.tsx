"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { WithdrawDialog } from "./withdraw-dialog";
import { clubActionService } from "@/services";
import { useAuthStore } from "@/stores/auth-store";
import { clubFee } from "@/lib/clubs/media";
import type { Club, ClubMembership } from "@/types";
import type { ClubMutations } from "../hooks/use-club-mutations";
export function MembershipActions({
  club,
  membership,
  loading,
  unavailable,
  onRequest,
  action,
}: {
  club: Club;
  membership?: ClubMembership;
  loading: boolean;
  unavailable: boolean;
  onRequest: () => void;
  action: ClubMutations;
}) {
  const user = useAuthStore((s) => s.user),
    [confirmOwner, setConfirmOwner] = useState<string | null>(null),
    returnTo = useRef<HTMLButtonElement | null>(null);
  const leaving = membership?.status === "approved";
  return (
    <>
      <aside
        className="club-detail-actions rounded-card border border-border bg-surface-raised p-4 shadow-raised lg:p-5"
        aria-label="Club membership actions"
      >
        <div className="flex items-center justify-between gap-3 lg:block">
          <div className="min-w-0">
            <p className="hidden text-[10px] font-bold tracking-widest text-brand uppercase lg:block">
              Your next good hello
            </p>
            <h2 className="hidden mt-2 font-display text-2xl font-semibold lg:block">
              Make room for community.
            </h2>
            <p className="text-xs font-semibold lg:mt-4 lg:text-base">{clubFee(club)}</p>
            {membership ? (
              <Badge
                tone={leaving ? "success" : membership.status === "pending" ? "warning" : "danger"}
                className="mt-2"
              >
                Membership: {membership.status}
              </Badge>
            ) : (
              <p className="mt-1 text-[10px] text-muted-foreground">
                {club.details?.accepting === false
                  ? "Requests currently closed"
                  : "All experience levels welcome"}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 lg:mt-5">
            {!user ? (
              <Button asChild>
                <Link
                  prefetch={false}
                  href={`/sign-in?next=${encodeURIComponent(`/clubs/${club.id}`)}`}
                >
                  Sign in to join <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : membership && membership.status !== "rejected" ? (
              <Button
                ref={returnTo}
                variant={leaving ? "secondary" : "ghost"}
                onClick={() => user && setConfirmOwner(`${user.id}:${user.email}`)}
                disabled={!!action.busy || loading || unavailable}
              >
                {leaving ? "Leave community" : "Withdraw request"}
              </Button>
            ) : (
              <Button
                onClick={onRequest}
                disabled={
                  !!action.busy || loading || unavailable || club.details?.accepting === false
                }
              >
                {unavailable
                  ? "Membership unavailable"
                  : loading
                    ? "Loading your activity…"
                    : membership?.status === "rejected"
                      ? "Request again"
                      : "Request to join"}
              </Button>
            )}
          </div>
        </div>
        <div className="hidden lg:block">
          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {clubActionService.source === "demo"
              ? "Local demo requests and approvals only. Fees are illustrative; no payment is collected."
              : "Your connected service decides membership. This page does not collect payments."}
          </p>
        </div>
      </aside>
      <WithdrawDialog
        open={!!user && confirmOwner === `${user.id}:${user.email}`}
        onClose={() => setConfirmOwner(null)}
        club={club}
        leaving={leaving}
        action={action}
        returnTo={returnTo}
      />
    </>
  );
}
