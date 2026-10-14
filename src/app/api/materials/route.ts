import { NextResponse } from "next/server";
import { adminRegistry } from "@/server/admin";
import { limited } from "@/server/guards";

// Student-facing: published course materials are readable by anyone signed in.
export async function GET(request: Request) {
  const hit = limited(request, "materials:public", 300);
  if (hit) return hit;
  return NextResponse.json({ items: adminRegistry.listMaterials("published") });
}
