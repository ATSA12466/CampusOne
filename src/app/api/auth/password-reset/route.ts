import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/server/audit";
import { clientIp, limited } from "@/server/guards";

// Honest stub: no mail delivery is configured yet, so this endpoint records the
// request and returns accepted:true without claiming an email was sent.
// See docs/API_INTEGRATION_GUIDE.md "Password reset" for the follow-up contract.
const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254) });

export async function POST(request: Request) {
  const hit = limited(request, "auth:password-reset", 10);
  if (hit) return hit;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  await audit({
    actorId: null,
    action: "auth.password-reset.requested",
    targetType: "user",
    targetId: parsed.data.email,
    ip: clientIp(request),
  });
  return NextResponse.json({ accepted: true as const });
}
