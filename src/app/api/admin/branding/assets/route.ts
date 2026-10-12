import { NextResponse } from "next/server";
import { audit } from "@/server/audit";
import { ASSET_KINDS, assetKey, assetSpec, saveAsset } from "@/server/admin";
import { invalidInput, limited, requirePermission } from "@/server/guards";

export async function POST(request: Request) {
  const hit = limited(request, "admin:branding:assets", 30);
  if (hit) return hit;
  const guarded = await requirePermission("platform.branding.manage", undefined, request);
  if (guarded instanceof NextResponse) return guarded;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return invalidInput("Expected a file upload.");
  }
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");
  if (!(ASSET_KINDS as readonly string[]).includes(kind))
    return invalidInput("Unknown asset kind.");
  if (!(file instanceof File)) return invalidInput("Attach a file to upload.");
  const spec = assetSpec(file.type);
  if (!spec) return invalidInput("Use PNG, JPEG, WebP, SVG or ICO files.");
  if (file.size === 0 || file.size > spec.maxBytes)
    return invalidInput(`Files must be non-empty and under ${Math.round(spec.maxBytes / 1_000_000)} MB.`);
  // Magic-byte sniffing: reject mismatched content masquerading as images.
  const bytes = Buffer.from(await file.arrayBuffer());
  const magic = bytes.subarray(0, 12).toString("binary");
  const looksRight =
    (spec.ext === "png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (spec.ext === "jpg" && bytes[0] === 0xff && bytes[1] === 0xd8) ||
    (spec.ext === "webp" && magic.startsWith("RIFF") && bytes.subarray(8, 12).toString() === "WEBP") ||
    (spec.ext === "ico" && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01) ||
    (spec.ext === "svg" && /<svg[\s>]/i.test(bytes.subarray(0, 2000).toString("utf8")));
  if (!looksRight) return invalidInput("The file content does not match its image type.");
  if (spec.ext === "svg" && /<script|on\w+\s*=|javascript:/i.test(bytes.toString("utf8")))
    return invalidInput("SVG files with scripts or event handlers are not allowed.");
  const key = assetKey(kind, spec.ext);
  saveAsset(key, bytes);
  await audit({
    actorId: guarded.user.id,
    action: "platform.branding.asset",
    targetType: "brand-asset",
    targetId: key,
    detail: kind,
  });
  return NextResponse.json({ item: { kind, key, url: `/api/brand/${key}` } }, { status: 201 });
}
