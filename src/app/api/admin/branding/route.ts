import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { adminRegistry } from "@/server/admin";
import { invalidInput, limited, readJson, requirePermission } from "@/server/guards";

const actionSchema = z.object({
  action: z.enum(["publish", "rollback"]),
  versionId: z.string().max(80).optional(),
});

export async function GET(request: Request) {
  const hit = limited(request, "admin:branding:get", 120);
  if (hit) return hit;
  const guarded = await requirePermission("platform.branding.manage", undefined, request);
  if (guarded instanceof NextResponse) return guarded;
  return NextResponse.json({
    published: adminRegistry.getPublishedBranding(),
    draft: adminRegistry.getDraftBranding(),
    versions: adminRegistry.listVersions().slice(0, 20),
  });
}

export async function PUT(request: Request) {
  const hit = limited(request, "admin:branding:draft", 30);
  if (hit) return hit;
  const guarded = await requirePermission("platform.branding.manage", undefined, request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  try {
    const draft = await adminRegistry.saveDraft(parsed.body, guarded.user.id);
    await audit({
      actorId: guarded.user.id,
      action: "platform.branding.draft",
      targetType: "branding",
      targetId: "draft",
    });
    return NextResponse.json({ draft });
  } catch {
    return invalidInput("Branding details are invalid. Check names, URLs and hex colors.");
  }
}

export async function POST(request: Request) {
  const hit = limited(request, "admin:branding:publish", 20);
  if (hit) return hit;
  const guarded = await requirePermission("platform.branding.manage", undefined, request);
  if (guarded instanceof NextResponse) return guarded;
  const parsed = await readJson(request);
  if (!parsed.ok) return parsed.response;
  const body = actionSchema.safeParse(parsed.body);
  if (!body.success) return invalidInput();
  if (body.data.action === "publish") {
    const { live, version } = await adminRegistry.publishDraft({
      id: guarded.user.id,
      name: guarded.user.name,
    });
    await audit({
      actorId: guarded.user.id,
      action: "platform.branding.publish",
      targetType: "branding",
      targetId: version.id,
      detail: live.displayName,
    });
    return NextResponse.json({ published: live, version });
  }
  if (!body.data.versionId) return invalidInput("Choose a version to restore.");
  const live = await adminRegistry.rollback(body.data.versionId, {
    id: guarded.user.id,
    name: guarded.user.name,
  });
  if (!live) return NextResponse.json({ error: "Version not found." }, { status: 404 });
  await audit({
    actorId: guarded.user.id,
    action: "platform.branding.rollback",
    targetType: "branding",
    targetId: body.data.versionId,
  });
  return NextResponse.json({ published: live });
}
