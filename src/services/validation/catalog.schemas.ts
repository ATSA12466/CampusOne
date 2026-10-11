import { z } from "zod";
import type { CollectionMap, CollectionName, Page } from "@/types/service-contracts";
import { featuredSchema } from "./home.schema";
import { engagementSchemas } from "./engagement.schemas";
import { lifeSchemas } from "./life.schemas";
const text = z.string();
export const entitySchemas: { [K in CollectionName]: z.ZodType<CollectionMap[K]> } = {
  featured: featuredSchema,
  ...engagementSchemas,
  ...lifeSchemas,
  resources: z.object({
    id: text,
    title: text,
    course: text,
    category: z.enum(["pdf", "video", "slides", "link"]),
    description: text,
    uploadedAt: text,
    downloadable: z.boolean(),
    url: text.optional(),
  }),
  courses: z.object({ id: text, code: text, title: text }),
  posts: z.object({
    id: text,
    author: text,
    body: text,
    createdAt: text,
    likes: z.number().nonnegative(),
    comments: z.number().nonnegative(),
  }),
  conversations: z.object({ id: text, name: text, lastMessage: text, updatedAt: text }),
  notifications: z.object({
    id: text,
    title: text,
    description: text,
    href: text,
    read: z.boolean(),
    category: z.enum(["tasks", "events", "clubs", "announcement"]),
  }),
  timetable: z.object({ id: text, day: text, course: text, start: text, end: text, venue: text }),
};
export function pageSchema<T>(entity: z.ZodType<T>): z.ZodType<Page<T>> {
  return z
    .object({
      items: z.array(entity),
      total: z.number().int().nonnegative(),
      page: z.number().int().min(1),
      pageSize: z.number().int().min(1).max(30),
    })
    .transform((page) => ({ ...page, hasMore: page.page * page.pageSize < page.total }));
}
