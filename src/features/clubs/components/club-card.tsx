import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { Badge, Button } from "@/components/ui";
import { clubCover } from "@/lib/clubs/media";
import { clubCategoryLabel } from "@/lib/clubs/category";
import type { Club, ClubMembership } from "@/types";
import { ClubFacts } from "./club-facts";
import { SaveClubButton } from "./save-club-button";
interface Props {
  club: Club;
  membership?: ClubMembership;
  saved: boolean;
  canRequest: boolean;
  onRequestJoin: () => void;
  onSave: () => void;
  busy: boolean;
  canSave: boolean;
}
export function ClubCard({
  club,
  membership,
  saved,
  canRequest,
  onRequestJoin,
  onSave,
  busy,
  canSave,
}: Props) {
  return (
    <article
      aria-labelledby={`club-title-${club.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-media border border-border bg-surface shadow-low"
    >
      <div className="relative">
        <Link
          prefetch={false}
          href={`/clubs/${club.id}`}
          aria-label={`Explore ${club.name}`}
          className="block"
        >
          <CampusImage
            image={clubCover(club)}
            imageClassName="media-zoom"
            sizes="(max-width:639px) calc(100vw - 2rem), (max-width:1279px) 50vw, 310px"
            quality={60}
          />
        </Link>
        <SaveClubButton
          name={club.name}
          saved={saved}
          disabled={busy || !canSave}
          onSave={onSave}
          overlay
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-brand uppercase">
            {clubCategoryLabel(club.category)}
          </p>
          <Link
            prefetch={false}
            href={`/clubs/${club.id}`}
            className="inline-flex min-h-11 items-center"
          >
            <h3
              id={`club-title-${club.id}`}
              className="font-display text-2xl font-semibold leading-tight"
            >
              {club.name}
            </h3>
          </Link>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {club.details?.tagline ?? club.description}
          </p>
        </div>
        <ClubFacts club={club} compact />
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Users className="size-3.5" aria-hidden="true" />
          <span>
            {club.details ? `${club.details.memberCount} members` : "Member count not supplied"}
          </span>
          {membership ? (
            <Badge
              tone={
                membership.status === "approved"
                  ? "success"
                  : membership.status === "pending"
                    ? "warning"
                    : "danger"
              }
            >
              Membership: {membership.status}
            </Badge>
          ) : null}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button asChild size="sm" variant="secondary">
            <Link prefetch={false} href={`/clubs/${club.id}`}>
              View club <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          {canRequest && club.details?.accepting !== false ? (
            <Button size="sm" onClick={onRequestJoin} disabled={busy}>
              Request to join
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
