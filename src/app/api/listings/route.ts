import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { audit } from "@/server/audit";
import { adminRegistry } from "@/server/admin";
import { invalidInput, limited, readJson, requireUser } from "@/server/guards";

// Student-facing: approved listings are public; submission needs an account.
export async function GET(request: Request) {
  const hit = limited(request, "listings:public", 300);
  if (hit) return hit;
  return NextResponse.json({ items: adminRegistry.approvedListings() });
}

export async function POST(request: Request) {
  const hit = limited(request, "listings:submit", 20);
  if (hit) return hit;
  const guarded = await requireUser();
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const item = await adminRegistry.submitListing(parsed.body, {
      id: guarded.user.id,
      name: guarded.user.name,
    });
    await audit({
      actorId: guarded.user.id,
      action: "accommodation.listings.submit",
      targetType: "listing",
      targetId: item.id,
      detail: item.title,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return invalidInput();
    throw error;
  }
}
