import { NextResponse } from "next/server";
import { adminRegistry } from "@/server/admin";
import { limited } from "@/server/guards";

// Public branding for site chrome (logos, names, theme accents). No secrets.
export async function GET(request: Request) {
  const hit = limited(request, "branding:public", 300);
  if (hit) return hit;
  const branding = adminRegistry.getPublishedBranding();
  return NextResponse.json(
    { branding },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
