import { NextResponse } from "next/server";
import { z } from "zod";
import { campus } from "@/server/campus";
import { invalidInput, limited, notFoundResponse, readJson, requireUser } from "@/server/guards";
import { findClub } from "../../../_lib/lookup";

const putSchema = z.object({ saved: z.boolean() });

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "clubs:saved:get", 180);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const { id } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  const saved = campus.userSaves(guarded.user.id, "club").includes(club.id);
  return NextResponse.json({ saved });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const hit = limited(request, "clubs:saved:set", 120);
  if (hit) return hit;
  const guarded = await requireUser(request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = putSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  const { id } = await params;
  const club = findClub(id);
  if (!club) return notFoundResponse("Club not found.");
  await campus.setSaved(guarded.user.id, "club", club.id, body.data.saved);
  return NextResponse.json({ saved: body.data.saved });
}
