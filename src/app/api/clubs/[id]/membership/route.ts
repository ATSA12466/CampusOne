import { NextResponse } from "next/server";
import { z } from "zod";
import { campus } from "@/server/campus";
import { invalidInput, limited, notFoundResponse, readJson, requireUser } from "@/server/guards";
import { findClub } from "../../../_lib/lookup";

const postSchema = z.object({ note: z.string().trim().max(400).default("") });

/** Request membership in a listed club (idempotent while pending/approved). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "clubs:membership:request", 60);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = postSchema.safeParse(parsed.body ?? {});
  if (!body.success) return invalidInput();
  const { id } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  const item = await campus.requestMembership(
    club.id,
    { id: guarded.user.id, name: guarded.user.name },
    body.data.note,
  );
  return NextResponse.json({ item }, { status: 201 });
}

/** Withdraw a request or leave a club entirely. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "clubs:membership:leave", 60);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  const removed = await campus.leaveClub(club.id, guarded.user.id);
  return NextResponse.json({ removed });
}
