import { z } from "zod";
import { store } from "./store";
import { workspaceSchemas } from "@/services/validation/workspace.schema";
import { taskRecordSchema } from "@/services/validation/task.schema";
import { studentRequestSchema } from "@/services/validation/campus-operations.schema";

// Account-synced personal store backing /api/me/store. One row per item:
// { userId, collection, id, item, updatedAt } in the me_items collection.
export const ME_COLLECTIONS = [
  "tasks",
  "sessions",
  "plans",
  "notes",
  "grades",
  "studyPlans",
  "communityPosts",
  "replies",
  "reactions",
  "concerns",
  "marketPosts",
  "reports",
  "enquiries",
  "profile",
  "requests",
] as const;

export type MeCollection = (typeof ME_COLLECTIONS)[number];
export const meCollectionSchema = z.enum(ME_COLLECTIONS);

const schemas: Record<MeCollection, z.ZodType> = {
  ...(workspaceSchemas as unknown as Record<MeCollection, z.ZodType>),
  tasks: taskRecordSchema,
  requests: studentRequestSchema,
};

export const ME_MAX_PER_COLLECTION = 200;

export interface MeItem {
  userId: string;
  collection: string;
  id: string;
  item: Record<string, unknown>;
  updatedAt: string;
}

export function listMine(userId: string, names: MeCollection[]): MeItem[] {
  return store.filter<MeItem>(
    "me_items",
    (r) => r.userId === userId && names.includes(r.collection as MeCollection),
  );
}

export class MeStoreError extends Error {
  readonly status: 400 | 409;

  constructor(message: string, status: 400 | 409) {
    super(message);
    this.status = status;
  }
}

/** Validate + upsert one item. Throws MeStoreError on invalid input or cap. */
export async function putMine(
  userId: string,
  collection: MeCollection,
  raw: unknown,
): Promise<Record<string, unknown>> {
  const parsed = schemas[collection].safeParse(raw);
  if (!parsed.success) throw new MeStoreError("The submitted details are invalid.", 400);
  const record = parsed.data as Record<string, unknown> & { id?: unknown };
  if (typeof record.id !== "string" || !record.id) {
    throw new MeStoreError("The submitted details are invalid.", 400);
  }
  const existing = listMine(userId, [collection]);
  if (!existing.some((r) => r.id === record.id) && existing.length >= ME_MAX_PER_COLLECTION) {
    throw new MeStoreError("This collection is full. Remove older items first.", 409);
  }
  await store.remove<MeItem>(
    "me_items",
    (r) => r.userId === userId && r.collection === collection && r.id === record.id,
  );
  await store.insert("me_items", {
    userId,
    collection,
    id: record.id,
    item: record,
    updatedAt: new Date().toISOString(),
  });
  return record;
}

export async function removeMine(
  userId: string,
  collection: MeCollection,
  id: string,
): Promise<boolean> {
  const removed = await store.remove<MeItem>(
    "me_items",
    (r) => r.userId === userId && r.collection === collection && r.id === id,
  );
  return removed > 0;
}
