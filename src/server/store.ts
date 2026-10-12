// Node-safe file-backed document store (dev/small-deployment persistence).
// Production contract: replace with the Drizzle/Postgres adapter behind the
// same repository functions; every write is validated by Zod at the boundary.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const STORE_VERSION = 1;

export interface StoreShape {
  version: number;
  users: Record<string, unknown>[];
  sessions: Record<string, unknown>[];
  grants: Record<string, unknown>[];
  audit: Record<string, unknown>[];
  [collection: string]: Record<string, unknown>[] | number;
}

export type CollectionName = "users" | "sessions" | "grants" | "audit";

function dataDir(): string {
  return process.env.CAMPUSONE_DATA_DIR?.trim() || join(process.cwd(), ".data");
}

export function storePath(): string {
  return join(dataDir(), "campusone.json");
}

function blank(): StoreShape {
  return { version: STORE_VERSION, users: [], sessions: [], grants: [], audit: [] };
}

function readStore(path: string): StoreShape {
  if (!existsSync(path)) return blank();
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<StoreShape>;
    if (typeof parsed !== "object" || parsed === null) return blank();
    return {
      version: STORE_VERSION,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      grants: Array.isArray(parsed.grants) ? parsed.grants : [],
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
    };
  } catch {
    return blank();
  }
}

let cache: { path: string; data: StoreShape } | null = null;
let writeChain: Promise<void> = Promise.resolve();

function current(): StoreShape {
  const path = storePath();
  if (!cache || cache.path !== path) cache = { path, data: readStore(path) };
  return cache.data;
}

function persist(data: StoreShape): Promise<void> {
  const path = storePath();
  writeChain = writeChain.then(() => {
    mkdirSync(dirname(path), { recursive: true });
    const tmp = `${path}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
    renameSync(tmp, path); // atomic replace; readers never see partial JSON
  });
  return writeChain;
}

/** Reset the in-process cache (tests / seed scripts). */
export function resetStoreCache(): void {
  cache = null;
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
    const data = current();
    (data[collection] as T[]).push(structuredClone(row));
    await persist(data);
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
    if (count > 0) await persist(data);
    return count;
  },
  async remove<T>(collection: CollectionName, predicate: (row: T) => boolean) {
    const data = current();
    const rows = data[collection] as T[];
    const kept = rows.filter((row) => !predicate(structuredClone(row)));
    const removed = rows.length - kept.length;
    data[collection] = kept as unknown as Record<string, unknown>[];
    if (removed > 0) await persist(data);
    return removed;
  },
  async replace<T extends object>(collection: CollectionName, rows: T[]) {
    const data = current();
    data[collection] = structuredClone(rows) as unknown as Record<string, unknown>[];
    await persist(data);
  },
};
