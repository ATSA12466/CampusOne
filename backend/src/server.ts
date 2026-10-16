import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { z } from "zod";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? "campusone-dev-secret";
const JWT_TTL_MS = 1000 * 60 * 60 * 12;

const userSchema = z.object({
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

type User = z.infer<typeof userSchema>;

type StoreItem = {
  id: string;
  collection: string;
  item: Record<string, unknown>;
};

const users: User[] = [
  {
    id: "user-1",
    email: "demo@campusone.test",
    name: "CampusOne Demo User",
    role: "student",
    roles: ["student"],
    permissions: ["read:profile", "write:profile", "read:clubs", "read:events"],
    programme: "Computer Science",
    level: "Level 200",
    verifiedStudent: true,
    avatar: null,
  },
];

const meStore = new Map<string, Record<string, StoreItem[]>>();

function issueToken(user: User) {
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_TTL_MS / 1000,
  });

  return {
    token,
    expiresAt: new Date(Date.now() + JWT_TTL_MS).toISOString(),
  };
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.authorization ?? "";
  const [, token] = authHeader.match(/^Bearer\s+(.+)$/i) ?? [];
  return token ?? null;
}

function getUserFromRequest(req: Request): User | null {
  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string; email?: string };
    const sub = payload.sub ?? payload.email ?? null;
    if (!sub) return null;
    const candidate = users.find((user) => user.id === sub || user.email === sub);
    return candidate ?? null;
  } catch {
    return null;
  }
}

function authRequired(req: Request, res: Response, next: NextFunction) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }

  (req as Request & { user?: User }).user = user;
  next();
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/token", (req, res) => {
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }

  const { email, password } = parsed.data;
  const user = users.find((entry) => entry.email === email && password.length >= 6);
  if (!user) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }

  const tokenData = issueToken(user);
  return res.json({ token: tokenData.token, expiresAt: tokenData.expiresAt, user });
});

app.get("/api/auth/token", (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }

  return res.json({ user });
});

app.delete("/api/auth/token", (req, res) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(200).json({ ok: true });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    return res.json({ ok: true });
  } catch {
    return res.json({ ok: true });
  }
});

app.get("/api/users/me", authRequired, (req, res) => {
  const user = (req as Request & { user?: User }).user;
  return res.json({ user });
});

app.patch("/api/users/me", authRequired, (req, res) => {
  const user = (req as Request & { user?: User }).user;
  const patchSchema = z.object({
    name: z.string().trim().min(1).optional(),
    programme: z.string().trim().nullable().optional(),
    level: z.string().trim().nullable().optional(),
    avatar: z.string().nullable().optional(),
  });

  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Profile details are invalid." });
  }

  const target = users.find((entry) => entry.id === user?.id);
  if (!target) {
    return res.status(404).json({ error: "Account not found." });
  }

  Object.assign(target, parsed.data);
  return res.json({ user: target });
});

app.get("/api/me/store", authRequired, (req, res) => {
  const collection = String(req.query.collection ?? "").trim();
  const user = (req as Request & { user?: User }).user;

  if (!user) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }

  const store = meStore.get(user.id) ?? {};
  const items = collection ? (store[collection] ?? []) : Object.values(store).flat();

  return res.json({ items: items.map((entry) => entry.item), total: items.length, page: 1, pageSize: 20 });
});

app.put("/api/me/store", authRequired, (req, res) => {
  const user = (req as Request & { user?: User }).user;
  const putSchema = z.object({
    collection: z.string().min(1),
    item: z.record(z.string(), z.unknown()),
  });

  const parsed = putSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body." });
  }

  if (!user) {
    return res.status(401).json({ error: "Please sign in to continue." });
  }

  const collectionName = parsed.data.collection;
  const entry: StoreItem = {
    id: String((parsed.data.item.id as string | undefined) ?? cryptoId()),
    collection: collectionName,
    item: parsed.data.item,
  };

  const existing = meStore.get(user.id) ?? {};
  const next = existing[collectionName] ?? [];
  const index = next.findIndex((item) => item.id === entry.id);
  if (index >= 0) {
    next[index] = entry;
  } else {
    next.push(entry);
  }

  existing[collectionName] = next;
  meStore.set(user.id, existing);

  return res.json({ item: entry.item });
});

app.get("/api/saves", authRequired, (_req, res) => {
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

app.listen(PORT, () => {
  console.log(`CampusOne backend listening on http://localhost:${PORT}`);
});

function cryptoId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
