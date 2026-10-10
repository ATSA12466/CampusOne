import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  // Demo frontend builds do not need a database. Do not report healthy without one.
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false }, { status: 503 });
  }

  try {
    const { db } = await import("@/db");
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
