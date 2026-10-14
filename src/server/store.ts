// Node-safe file-backed document store (dev/small-deployment persistence).
// Production contract: replace with the Drizzle/Postgres adapter behind the
// same repository functions; every write is validated by Zod at the boundary.
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const STORE_VERSION = 1;

export interface StoreShape {
  version: number;
  users: Record<string, unknown>[];
  sessions: Record<string, unknown>[];
  grants: Record<string, unknown>[];
  audit: Record<string, unknown>[];
  clubs: Record<string, unknown>[];
  nominations: Record<string, unknown>[];
  appointments: Record<string, unknown>[];
  announcements: Record<string, unknown>[];
  requests: Record<string, unknown>[];
  src_profiles: Record<string, unknown>[];
  branding: Record<string, unknown>[];
  brand_versions: Record<string, unknown>[];
  listings: Record<string, unknown>[];
  reports: Record<string, unknown>[];
  materials: Record<string, unknown>[];
  settings: Record<string, unknown>[];
  campus_events: Record<string, unknown>[];
  memberships: Record<string, unknown>[];
  saves: Record<string, unknown>[];
  rsvps: Record<string, unknown>[];
  officers: Record<string, unknown>[];
  resources: Record<string, unknown>[];
  attendance_sessions: Record<string, unknown>[];
  attendance_records: Record<string, unknown>[];
  badge_definitions: Record<string, unknown>[];
  badges_awarded: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
  conversations: Record<string, unknown>[];
  conversation_members: Record<string, unknown>[];
  messages: Record<string, unknown>[];
  devices: Record<string, unknown>[];
  [collection: string]: Record<string, unknown>[] | number;
}

export type CollectionName =
  | "users"
  | "sessions"
  | "grants"
  | "audit"
  | "clubs"
  | "nominations"
  | "appointments"
  | "announcements"
  | "requests"
  | "src_profiles"
  | "branding"
  | "brand_versions"
  | "listings"
  | "reports"
  | "materials"
  | "settings"
  | "campus_events"
  | "memberships"
  | "saves"
  | "rsvps"
  | "officers"
  | "resources"
  | "attendance_sessions"
  | "attendance_records"
  | "badge_definitions"
  | "badges_awarded"
  | "notifications"
  | "conversations"
  | "conversation_members"
  | "messages"
  | "devices"
  | "me_items";

function dataDir(): string {
  return process.env.CAMPUSONE_DATA_DIR?.trim() || join(process.cwd(), ".data");
}

export function storePath(): string {
  return join(dataDir(), "campusone.json");
}

const KNOWN_COLLECTIONS: CollectionName[] = [
  "users",
  "sessions",
  "grants",
  "audit",
  "clubs",
  "nominations",
  "appointments",
  "announcements",
  "requests",
  "src_profiles",
  "branding",
  "brand_versions",
  "listings",
  "reports",
  "materials",
  "settings",
  "campus_events",
  "memberships",
  "saves",
  "rsvps",
  "officers",
  "resources",
  "attendance_sessions",
  "attendance_records",
  "badge_definitions",
  "badges_awarded",
  "notifications",
  "conversations",
  "conversation_members",
  "messages",
  "devices",
  "me_items",
];

function blank(): StoreShape {
  const shape: StoreShape = {
    version: STORE_VERSION,
    users: [],
    sessions: [],
    grants: [],
    audit: [],
    clubs: [],
    nominations: [],
    appointments: [],
    announcements: [],
    requests: [],
    src_profiles: [],
    branding: [],
    brand_versions: [],
    listings: [],
    reports: [],
    materials: [],
    settings: [],
    campus_events: [],
    memberships: [],
    saves: [],
    rsvps: [],
    officers: [],
    resources: [],
    attendance_sessions: [],
    attendance_records: [],
    badge_definitions: [],
    badges_awarded: [],
    notifications: [],
    conversations: [],
    conversation_members: [],
    messages: [],
    devices: [],
    me_items: [],
  };
  return shape;
}

function readStore(path: string): StoreShape {
  const shape = blank();
  if (!existsSync(path)) return shape;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<StoreShape>;
    if (typeof parsed !== "object" || parsed === null) return shape;
    for (const name of KNOWN_COLLECTIONS)
      shape[name] = Array.isArray(parsed[name]) ? parsed[name] : [];
    return shape;
  } catch {
    return shape;
  }
}

interface StoreCache {
  path: string;
  data: StoreShape;
  mtimeMs: number;
  size: number;
}

function cacheSlot(): { current: StoreCache | null } {
  // One cache per process even if the bundler evaluates this module twice
  // (dev servers may keep separate route/page module graphs sharing state).
  const globalRef = globalThis as unknown as { __campusoneStore?: { current: StoreCache | null } };
  globalRef.__campusoneStore ??= { current: null };
  return globalRef.__campusoneStore;
}

function fingerprint(path: string): { mtimeMs: number; size: number } {
  try {
    const stat = statSync(path);
    return { mtimeMs: stat.mtimeMs, size: stat.size };
  } catch {
    return { mtimeMs: 0, size: -1 };
  }
}

function current(): StoreShape {
  const path = storePath();
  // Reload when another process (seed scripts, tooling) replaced the file.
  const fp = fingerprint(path);
  const slot = cacheSlot();
  const cached = slot.current;
  if (
    !cached ||
    cached.path !== path ||
    cached.mtimeMs !== fp.mtimeMs ||
    cached.size !== fp.size
  ) {
    slot.current = { path, data: readStore(path), mtimeMs: fp.mtimeMs, size: fp.size };
  }
  return (slot.current as StoreCache).data;
}

function persist(data: StoreShape): void {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  renameSync(tmp, path); // atomic replace; readers never see partial JSON
  const fp = fingerprint(path);
  const slot = cacheSlot();
  if (slot.current && slot.current.path === path) {
    slot.current.mtimeMs = fp.mtimeMs;
    slot.current.size = fp.size;
  }
}

/** Reset the in-process cache (tests / seed scripts). */
export function resetStoreCache(): void {
  cacheSlot().current = null;
}

export interface Store {
  all<T>(collection: CollectionName): T[];
  find<T>(collection: CollectionName, predicate: (row: T) => boolean): T | null;
  filter<T>(collection: CollectionName, predicate: (row: T) => boolean): T[];
  insert<T extends object>(collection: CollectionName, row: T): Promise<T>;
  update<T extends object>(
    collection: CollectionName,
    predicate: (row: T) => boolean,
    patch: Partial<T>,
  ): Promise<number>;
  remove<T>(collection: CollectionName, predicate: (row: T) => boolean): Promise<number>;
  replace<T extends object>(collection: CollectionName, rows: T[]): Promise<void>;
}

export const store: Store = {
  all<T>(collection: CollectionName): T[] {
    return structuredClone(current()[collection] as T[]);
  },
  find<T>(collection: CollectionName, predicate: (row: T) => boolean): T | null {
    const row = (current()[collection] as T[]).find(predicate);
    return row ? structuredClone(row) : null;
  },
  filter<T>(collection: CollectionName, predicate: (row: T) => boolean): T[] {
    return structuredClone((current()[collection] as T[]).filter(predicate));
  },
  async insert<T extends object>(collection: CollectionName, row: T): Promise<T> {
    // Synchronous read-modify-write: no await between current() and persist()
    // so interleaved realms cannot silently drop each other's rows.
    const data = current();
    (data[collection] as T[]).push(structuredClone(row));
    persist(data);
    return structuredClone(row);
  },
  async update<T extends object>(
    collection: CollectionName,
    predicate: (row: T) => boolean,
    patch: Partial<T>,
  ) {
    const data = current();
    let count = 0;
    for (const row of data[collection] as T[]) {
      if (predicate(structuredClone(row))) {
        Object.assign(row, structuredClone(patch));
        count += 1;
      }
    }
    if (count > 0) persist(data);
    return count;
  },
  async remove<T>(collection: CollectionName, predicate: (row: T) => boolean) {
    const data = current();
    const rows = data[collection] as T[];
    const kept = rows.filter((row) => !predicate(structuredClone(row)));
    const removed = rows.length - kept.length;
    data[collection] = kept as unknown as Record<string, unknown>[];
    if (removed > 0) persist(data);
    return removed;
  },
  async replace<T extends object>(collection: CollectionName, rows: T[]) {
    const data = current();
    data[collection] = structuredClone(rows) as unknown as Record<string, unknown>[];
    persist(data);
  },
};
