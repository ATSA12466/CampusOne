import { NextResponse } from "next/server";
import { limited, requireUser } from "@/server/guards";
import { campus } from "@/server/campus";
import { collectionOverlays } from "@/server/overlays";
import { engagementService } from "@/services/demo";
import { canManageClub } from "../../../_lib/manage";

function text(item: object, keys: readonly string[], fallback = ""): string {
  for (const key of keys) {
    const value: unknown = Object.entries(item).find(([name]) => name === key)?.[1];
    if (typeof value === "string" && value) return value;
  }
  return fallback;
}

/**
 * Clubs the signed-in user belongs to, with per-club manage rights and
 * pending-request counts (executives). Powers the mobile manage hub.
 * Catalog membership is evaluated against fixtures + live overlays, the same
 * merged set the club catalog serves.
 */
export async function GET(request: Request) {
  const hit = limited(request, "users:me:clubs", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;

  const merged = new Map<string, object>();
  for (const club of engagementService.listClubs()) merged.set(club.id, club);
  const { items: overlays } = collectionOverlays("clubs");
  for (const club of overlays as unknown as { id: string }[]) {
    if (club?.id) merged.set(club.id, club as unknown as object);
  }

  const membershipByClub = new Map(
    campus
      .userMemberships(guarded.user.id)
      .filter((membership) => membership.status !== "rejected")
      .map((membership) => [membership.clubId, membership.status]),
  );

  const items = [...merged.entries()]
    .map(([clubId, club]) => {
      const managed = canManageClub(
        guarded.serverUser,
        clubId,
        "club.members.manage",
      );
      const status = membershipByClub.get(clubId) ?? (managed ? "manager" : null);
      if (!status) return null;
      const pendingRequests = managed
        ? campus
            .listMemberships(clubId)
            .filter((row) => row.status === "pending").length
        : 0;
      return {
        clubId,
        clubName: text(club, ["name", "title"], "Campus club"),
        category: text(club, ["category", "kind", "type"]),
        status,
        managed,
        pendingRequests,
      };
    })
    .filter((item) => item !== null);
  return NextResponse.json({ items });
}
