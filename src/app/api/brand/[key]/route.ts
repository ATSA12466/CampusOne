import { NextResponse } from "next/server";
import { readAsset } from "@/server/admin";
import { limited } from "@/server/guards";

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const hit = limited(request, "brand:asset", 600);
  if (hit) return hit;
  const { key } = await params;
  const asset = readAsset(key);
  if (!asset) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return new NextResponse(new Uint8Array(asset.bytes), {
    headers: {
      "Content-Type": asset.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
