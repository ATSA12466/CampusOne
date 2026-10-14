import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { campus } from "@/server/campus";
import { notify } from "@/server/notify";
import {
  invalidInput,
  limited,
  notFoundResponse,
  readJson,
  requireUser,
} from "@/server/guards";
import { canManageClub } from "../../../_lib/manage";

const patchSchema = z.object({ status: z.enum(["approved", "rejected"]) });

/** Membership detail (own, or club viewers). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "clubs:membership:get", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const item = campus.getMembership(id);
  if (!item) return notFoundResponse("Membership not found.");
  const own = item.userId === guarded.user.id;
  if (!own && !canManageClub(guarded.serverUser, item.clubId, "club.members.view"))
    return NextResponse.json({ error: "You do not have access to this membership." }, { status: 403 });
  return NextResponse.json({ item });
}

/** Approve/reject a membership request (club managers). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "clubs:membership:review", 60);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = patchSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  const { id } = await params;
  const existing = campus.getMembership(id);
  if (!existing) return notFoundResponse("Membership not found.");
  if (!canManageClub(guarded.serverUser, existing.clubId, "club.members.manage"))
    return NextResponse.json(
      { error: "Only club managers can review memberships." },
      { status: 403 },
    );
  const item = await campus.reviewMembership(id, body.data.status, guarded.user.id);
  if (!item) return notFoundResponse("Membership not found.");
  await audit({
    actorId: guarded.user.id,
    action: `club.members.${body.data.status}`,
    targetType: "membership",
    targetId: id,
    detail: item.applicantName,
  });
  await notify(item.userId, {
    kind: "membership",
    title: body.data.status === "approved" ? "Membership approved" : "Membership decision",
    body:
      body.data.status === "approved"
        ? "Your club membership request was approved. Welcome!"
        : "Your club membership request was not approved this time.",
    link: "/clubs",
  });
  return NextResponse.json({ item });
}
