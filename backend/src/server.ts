import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "./db/index.js";
import { meStore, sessions, users } from "./db/schema.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? "campusone-dev-secret";
const JWT_TTL_MS = 12 * 60 * 60 * 1000;

const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.string(),
  roles: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  programme: z.string().nullable().default(null),
  level: z.string().nullable().default(null),
  verifiedStudent: z.boolean().default(true),
  avatar: z.string().nullable().default(null),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const profilePatchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  programme: z.string().trim().nullable().optional(),
  level: z.string().trim().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

function serializeUser(user: typeof users.$inferSelect) {
  return userResponseSchema.parse({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roles: Array.isArray(user.roles) ? user.roles : [],
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
    programme: user.programme ?? null,
    level: user.level ?? null,
    verifiedStudent: user.verifiedStudent,
    avatar: user.avatar ?? null,
  });
}

function hashPassword(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function ensureSeedUser() {
  const seedEmail = "demo@campusone.test";
  const existing = await db.query.users.findFirst({
    where: eq(users.email, seedEmail),
  });

  if (existing) return existing;

  const user = {
    id: "user-1",
    email: seedEmail,
    passwordHash: hashPassword("password123"),
    name: "CampusOne Demo User",
    role: "student",
    roles: ["student"],
    permissions: ["read:profile", "write:profile", "read:clubs", "read:events"],
    programme: "Computer Science",
    level: "Level 200",
    verifiedStudent: true,
    avatar: null,
  };

  await db.insert(users).values(user);
  return user;
}

async function ensureDatabase() {
  try {
    await db.execute(sql`SELECT 1`);
    await ensureSeedUser();
    console.log("PostgreSQL connection ready.");
  } catch (error) {
    console.error("PostgreSQL connection failed.", error);
    process.exit(1);
  }
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.authorization ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

async function currentUserFromRequest(req: Request) {
  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string; email?: string };
    const subject = payload.sub ?? payload.email;
    if (!subject) return null;

    const user = await db.query.users.findFirst({
      where: and(eq(users.id, subject), eq(users.email, subject)),
    });

    if (!user) {
      const byEmail = await db.query.users.findFirst({
        where: eq(users.email, subject),
      });
      return byEmail ? serializeUser(byEmail) : null;
    }

    return serializeUser(user);
  } catch {
    return null;
  }
}

function issueToken(user: typeof users.$inferSelect) {
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_TTL_MS / 1000,
  });

  return {
    token,
    expiresAt: new Date(Date.now() + JWT_TTL_MS).toISOString(),
  };
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    return res.json({ ok: true });
  } catch (error) {
    console.error("Health check failed:", error);
    return res.status(503).json({ ok: false });
  }
});

app.post("/api/auth/token", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }

  const { email, password } = parsed.data;
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }

  const tokenData = issueToken(user);
  await db.insert(sessions).values({
    id: randomUUID(),
    userId: user.id,
    tokenHash: createHash("sha256").update(tokenData.token).digest("hex"),
    expiresAt: new Date(Date.now() + JWT_TTL_MS),
  }).onConflictDoNothing();

  return res.json({ token: tokenData.token, expiresAt: tokenData.expiresAt, user: serializeUser(user) });
});

app.get("/api/auth/token", async (req, res) => {
  const user = await currentUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Please sign in to continue." });
  return res.json({ user });
});

app.delete("/api/auth/token", async (req, res) => {
  const token = getBearerToken(req);
  if (!token) return res.json({ ok: true });

  const hash = createHash("sha256").update(token).digest("hex");
  await db.delete(sessions).where(eq(sessions.tokenHash, hash));
  return res.json({ ok: true });
});

app.get("/api/users/me", async (req, res) => {
  const user = await currentUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Please sign in to continue." });
  return res.json({ user });
});

app.patch("/api/users/me", async (req, res) => {
  const user = await currentUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Please sign in to continue." });

  const parsed = profilePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Profile details are invalid." });
  }

  const updated = await db.update(users)
    .set({
      name: parsed.data.name ?? user.name,
      programme: parsed.data.programme ?? user.programme ?? null,
      level: parsed.data.level ?? user.level ?? null,
      avatar: parsed.data.avatar ?? user.avatar ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  if (!updated[0]) return res.status(404).json({ error: "Account not found." });
  return res.json({ user: serializeUser(updated[0]) });
});

app.get("/api/me/store", async (req, res) => {
  const user = await currentUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Please sign in to continue." });

  const collection = String(req.query.collection ?? "").trim();
  const rows = collection
    ? await db.select().from(meStore).where(and(eq(meStore.userId, user.id), eq(meStore.collection, collection)))
    : await db.select().from(meStore).where(eq(meStore.userId, user.id));

  return res.json({
    items: rows.map((row) => row.item),
    total: rows.length,
    page: 1,
    pageSize: rows.length || 20,
  });
});

app.put("/api/me/store", async (req, res) => {
  const user = await currentUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Please sign in to continue." });

  const putSchema = z.object({
    collection: z.string().min(1),
    item: z.record(z.string(), z.unknown()),
  });

  const parsed = putSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid request body." });

  const id = String(parsed.data.item.id ?? randomUUID());
  const row = {
    id,
    userId: user.id,
    collection: parsed.data.collection,
    item: parsed.data.item,
    updatedAt: new Date(),
  };

  const existing = await db.query.meStore.findFirst({
    where: and(eq(meStore.userId, user.id), eq(meStore.id, id)),
  });

  if (existing) {
    const updated = await db.update(meStore)
      .set(row)
      .where(and(eq(meStore.userId, user.id), eq(meStore.id, id)))
      .returning();
    return res.json({ item: updated[0]?.item ?? parsed.data.item });
  }

  const inserted = await db.insert(meStore).values({
    id,
    userId: user.id,
    collection: parsed.data.collection,
    item: parsed.data.item,
  }).returning();

  return res.json({ item: inserted[0]?.item ?? parsed.data.item });
});

app.get("/api/saves", async (req, res) => {
  const user = await currentUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Please sign in to continue." });
  return res.json({ items: [], total: 0, page: 1, pageSize: 20 });
});

app.get("/api/branding/public", (_req, res) => {
  return res.json({
    id: "campusone-brand",
    name: "CampusOne",
    theme: "light",
    accent: "#1d4ed8",
    logo: null,
  });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
});

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set; create a local Postgres instance and configure the environment before running the app.");
}

app.listen(PORT, async () => {
  await ensureDatabase();
  console.log(`CampusOne PostgreSQL backend listening on http://localhost:${PORT}`);
});
