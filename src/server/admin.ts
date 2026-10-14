// Node-safe Super Admin domain: branding, listings, moderation reports,
// course materials, settings and user administration repositories.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { newId } from "./crypto";
import { store } from "./store";
import type { PlatformRole, ServerUser } from "./types";

// ---------- Branding ----------

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected a hex color like #003399");

export const brandingSchema = z.object({
  id: z.enum(["published", "draft"]),
  displayName: z.string().trim().min(2).max(60).default("CampusOne"),
  tagline: z.string().trim().max(120).default("Your campus, connected."),
  logoLight: z.string().trim().max(500).default(""),
  logoDark: z.string().trim().max(500).default(""),
  logoLogin: z.string().trim().max(500).default(""),
  appIcon: z.string().trim().max(500).default(""),
  favicon: z.string().trim().max(500).default(""),
  pwaIcon: z.string().trim().max(500).default(""),
  bannerDefault: z.string().trim().max(500).default(""),
  colors: z
    .object({
      brand: hexColor,
      brandInk: hexColor,
      accent: hexColor,
      cream: hexColor,
    })
    .default({ brand: "#003399", brandInk: "#0B2545", accent: "#FFCC00", cream: "#FFFDF2" }),
  updatedBy: z.string().max(80).default(""),
  updatedAt: z.string().datetime(),
});
export type Branding = z.infer<typeof brandingSchema>;

export const brandingWriteSchema = brandingSchema.omit({ id: true, updatedBy: true, updatedAt: true });

export const brandVersionSchema = z.object({
  id: z.string().min(1).max(80),
  snapshot: brandingSchema,
  publishedBy: z.string().max(80),
  publishedByName: z.string().max(120),
  publishedAt: z.string().datetime(),
});
export type BrandVersion = z.infer<typeof brandVersionSchema>;

function defaultBranding(id: "published" | "draft"): Branding {
  return brandingSchema.parse({ id, updatedAt: new Date().toISOString() });
}

export const ASSET_KINDS = ["logoLight", "logoDark", "logoLogin", "appIcon", "favicon", "pwaIcon", "bannerDefault"] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

const ASSET_MIME: Record<string, { ext: string; maxBytes: number }> = {
  "image/png": { ext: "png", maxBytes: 2_000_000 },
  "image/jpeg": { ext: "jpg", maxBytes: 2_000_000 },
  "image/webp": { ext: "webp", maxBytes: 2_000_000 },
  "image/svg+xml": { ext: "svg", maxBytes: 500_000 },
  "image/x-icon": { ext: "ico", maxBytes: 500_000 },
  "image/vnd.microsoft.icon": { ext: "ico", maxBytes: 500_000 },
};

export function assetSpec(mime: string): { ext: string; maxBytes: number } | null {
  return ASSET_MIME[mime] ?? null;
}

function brandDir(): string {
  const dir = join(process.env.CAMPUSONE_DATA_DIR?.trim() || join(process.cwd(), ".data"), "brand");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function assetKey(kind: string, ext: string): string {
  return `${kind}-${newId("a").slice(2)}.${ext}`;
}

export function saveAsset(key: string, bytes: Buffer): void {
  if (!/^[a-zA-Z]+-[0-9a-f]{24}\.(png|jpg|webp|svg|ico)$/.test(key))
    throw new Error("Invalid asset key.");
  writeFileSync(join(brandDir(), key), bytes);
}

export function readAsset(key: string): { bytes: Buffer; mime: string } | null {
  if (!/^[a-zA-Z]+-[0-9a-f]{24}\.(png|jpg|webp|svg|ico)$/.test(key)) return null;
  const path = join(brandDir(), key);
  if (!existsSync(path)) return null;
  const ext = key.split(".").pop() ?? "";
  const mime =
    ext === "png"
      ? "image/png"
      : ext === "jpg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : ext === "svg"
            ? "image/svg+xml"
            : "image/x-icon";
  return { bytes: readFileSync(path), mime };
}

/** SVG uploads are served with a safe content type; scripts inside are inert when used as <img>. */
export function sanitizeSvgNote(): string {
  return "SVG assets are served as images only and never inlined into admin HTML.";
}

// ---------- Accommodation listings ----------

export const listingSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().min(4).max(160),
  area: z.string().trim().min(2).max(120),
  price: z.number().positive().max(1_000_000),
  period: z.enum(["semester", "month", "year"]),
  beds: z.number().int().min(1).max(20).default(1),
  description: z.string().trim().min(20).max(3000),
  contact: z.string().trim().min(3).max(160),
  status: z.enum(["pending", "approved", "rejected"]),
  submittedBy: z.string().max(80),
  submittedByName: z.string().max(120),
  decidedBy: z.string().max(80).nullable().default(null),
  decidedAt: z.string().datetime().nullable().default(null),
  note: z.string().max(1000).default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Listing = z.infer<typeof listingSchema>;

export const listingSubmitSchema = listingSchema.pick({
  title: true,
  area: true,
  price: true,
  period: true,
  beds: true,
  description: true,
  contact: true,
});

export const listingDecisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(1000).default(""),
});

// ---------- Moderation reports ----------

export const reportSchema = z.object({
  id: z.string().min(1).max(80),
  targetType: z.enum(["post", "message", "user", "listing", "club", "other"]),
  targetId: z.string().trim().min(1).max(160),
  reason: z.string().trim().min(4).max(500),
  detail: z.string().trim().max(2000).default(""),
  status: z.enum(["open", "reviewing", "actioned", "dismissed"]),
  reporterId: z.string().max(80),
  reporterName: z.string().max(120),
  assignee: z.string().max(120).default(""),
  resolution: z.string().max(2000).default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ModerationReport = z.infer<typeof reportSchema>;

export const reportSubmitSchema = reportSchema.pick({ targetType: true, targetId: true, reason: true, detail: true });
export const reportTriageSchema = reportSchema.pick({ status: true, assignee: true, resolution: true });

// ---------- Course materials ----------

export const materialSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().min(4).max(200),
  course: z.string().trim().min(2).max(120),
  kind: z.enum(["note", "past-question", "slide", "reading", "video", "other"]),
  description: z.string().trim().max(2000).default(""),
  fileUrl: z.string().trim().max(1000).default(""),
  status: z.enum(["draft", "published", "archived"]),
  authorId: z.string().max(80),
  authorName: z.string().max(120),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Material = z.infer<typeof materialSchema>;

export const materialWriteSchema = materialSchema.pick({
  title: true,
  course: true,
  kind: true,
  description: true,
  fileUrl: true,
  status: true,
});

// ---------- Settings ----------

export const settingSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.string().max(2000),
  updatedBy: z.string().max(80).default(""),
  updatedAt: z.string().datetime(),
});
export type Setting = z.infer<typeof settingSchema>;

export const KNOWN_SETTINGS = ["supportEmail", "maintenanceMessage", "announcementBanner"] as const;

// ---------- Repositories ----------

function now(): string {
  return new Date().toISOString();
}

export const adminRegistry = {
  // Branding
  getPublishedBranding: (): Branding => {
    const found = store.find<Branding>("branding", (b) => b.id === "published");
    return found ?? defaultBranding("published");
  },
  getDraftBranding: (): Branding => {
    const found = store.find<Branding>("branding", (b) => b.id === "draft");
    return found ?? { ...adminRegistry.getPublishedBranding(), id: "draft" as const };
  },
  saveDraft: async (input: unknown, by: string): Promise<Branding> => {
    const row = brandingSchema.parse({
      ...brandingWriteSchema.parse(input),
      id: "draft",
      updatedBy: by,
      updatedAt: now(),
    });
    const existing = store.find<Branding>("branding", (b) => b.id === "draft");
    if (existing)
      await store.update<Branding>("branding", (b) => b.id === "draft", row);
    else await store.insert("branding", row as unknown as Record<string, unknown>);
    return row;
  },
  publishDraft: async (by: { id: string; name: string }): Promise<{ live: Branding; version: BrandVersion }> => {
    const draft = adminRegistry.getDraftBranding();
    const live = brandingSchema.parse({ ...draft, id: "published", updatedBy: by.id, updatedAt: now() });
    const existing = store.find<Branding>("branding", (b) => b.id === "published");
    if (existing)
      await store.update<Branding>("branding", (b) => b.id === "published", live);
    else await store.insert("branding", live as unknown as Record<string, unknown>);
    const version: BrandVersion = {
      id: newId("bv"),
      snapshot: live,
      publishedBy: by.id,
      publishedByName: by.name,
      publishedAt: now(),
    };
    await store.insert("brand_versions", version as unknown as Record<string, unknown>);
    return { live, version };
  },
  listVersions: (): BrandVersion[] =>
    store.all<BrandVersion>("brand_versions").sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
  rollback: async (versionId: string, by: { id: string; name: string }): Promise<Branding | null> => {
    const version = store.find<BrandVersion>("brand_versions", (v) => v.id === versionId);
    if (!version) return null;
    const live = brandingSchema.parse({ ...version.snapshot, id: "published", updatedBy: by.id, updatedAt: now() });
    await store.update<Branding>("branding", (b) => b.id === "published", live);
    const entry: BrandVersion = {
      id: newId("bv"),
      snapshot: live,
      publishedBy: by.id,
      publishedByName: `${by.name} (rollback)`,
      publishedAt: now(),
    };
    await store.insert("brand_versions", entry as unknown as Record<string, unknown>);
    return live;
  },

  // Listings
  listListings: (status?: string) =>
    store
      .filter<Listing>("listings", (r) => !status || r.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  approvedListings: () => adminRegistry.listListings("approved"),
  submitListing: async (input: unknown, by: { id: string; name: string }): Promise<Listing> => {
    const row = listingSchema.parse({
      ...listingSubmitSchema.parse(input),
      id: newId("lst"),
      status: "pending",
      submittedBy: by.id,
      submittedByName: by.name,
      decidedBy: null,
      decidedAt: null,
      note: "",
      createdAt: now(),
      updatedAt: now(),
    });
    await store.insert("listings", row as unknown as Record<string, unknown>);
    return row;
  },
  decideListing: async (id: string, input: unknown, by: string): Promise<Listing | null> => {
    const decision = listingDecisionSchema.parse(input);
    const existing = store.find<Listing>("listings", (r) => r.id === id);
    if (!existing) return null;
    const row = listingSchema.parse({
      ...existing,
      status: decision.status,
      note: decision.note,
      decidedBy: by,
      decidedAt: now(),
      updatedAt: now(),
    });
    await store.update<Listing>("listings", (r) => r.id === id, row);
    return row;
  },

  // Reports
  listReports: (status?: string) =>
    store
      .filter<ModerationReport>("reports", (r) => !status || r.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  submitReport: async (input: unknown, by: { id: string; name: string }): Promise<ModerationReport> => {
    const row = reportSchema.parse({
      ...reportSubmitSchema.parse(input),
      id: newId("rep"),
      status: "open",
      reporterId: by.id,
      reporterName: by.name,
      assignee: "",
      resolution: "",
      createdAt: now(),
      updatedAt: now(),
    });
    await store.insert("reports", row as unknown as Record<string, unknown>);
    return row;
  },
  triageReport: async (id: string, input: unknown): Promise<ModerationReport | null> => {
    const existing = store.find<ModerationReport>("reports", (r) => r.id === id);
    if (!existing) return null;
    const row = reportSchema.parse({ ...existing, ...reportTriageSchema.parse(input), updatedAt: now() });
    await store.update<ModerationReport>("reports", (r) => r.id === id, row);
    return row;
  },

  // Materials
  listMaterials: (status?: string) =>
    store
      .filter<Material>("materials", (r) => !status || r.status === status)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  createMaterial: async (input: unknown, by: { id: string; name: string }): Promise<Material> => {
    const row = materialSchema.parse({
      ...materialWriteSchema.parse(input),
      id: newId("mat"),
      authorId: by.id,
      authorName: by.name,
      createdAt: now(),
      updatedAt: now(),
    });
    await store.insert("materials", row as unknown as Record<string, unknown>);
    return row;
  },
  updateMaterial: async (id: string, input: unknown): Promise<Material | null> => {
    const existing = store.find<Material>("materials", (r) => r.id === id);
    if (!existing) return null;
    const row = materialSchema.parse({ ...existing, ...materialWriteSchema.parse(input), updatedAt: now() });
    await store.update<Material>("materials", (r) => r.id === id, row);
    return row;
  },
  deleteMaterial: (id: string) => store.remove<Material>("materials", (r) => r.id === id),

  // Settings
  getSettings: (): Record<string, string> => {
    const out: Record<string, string> = {};
    // Server-managed secrets are never exposed through the settings API.
    for (const row of store.all<Setting>("settings"))
      if (!row.key.startsWith("secret.")) out[row.key] = row.value;
    return out;
  },
  saveSetting: async (key: string, value: string, by: string): Promise<Setting> => {
    const row = settingSchema.parse({ key, value, updatedBy: by, updatedAt: now() });
    const existing = store.find<Setting>("settings", (r) => r.key === key);
    if (existing) await store.update<Setting>("settings", (r) => r.key === key, row);
    else await store.insert("settings", row as unknown as Record<string, unknown>);
    return row;
  },

  // Users (admin)
  listUsers: (query?: string) => {
    const q = (query ?? "").trim().toLowerCase();
    return store
      .filter<ServerUser>("users", (u) =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roles.some((r) => r.includes(q)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        roles: u.roles,
        programme: u.programme,
        level: u.level,
        status: u.status,
        verifiedStudent: u.verifiedStudent,
        createdAt: u.createdAt,
      }));
  },
  updateUser: async (
    id: string,
    patch: { status?: "active" | "suspended"; verifiedStudent?: boolean; roles?: PlatformRole[] },
  ): Promise<ServerUser | null> => {
    const existing = store.find<ServerUser>("users", (u) => u.id === id);
    if (!existing) return null;
    const row: ServerUser = {
      ...existing,
      ...(patch.status ? { status: patch.status } : {}),
      ...(typeof patch.verifiedStudent === "boolean" ? { verifiedStudent: patch.verifiedStudent } : {}),
      ...(patch.roles ? { roles: patch.roles } : {}),
      updatedAt: now(),
    };
    await store.update<ServerUser>("users", (u) => u.id === id, row);
    return row;
  },
};
