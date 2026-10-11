import { studentReturnPath } from "@/lib/auth/return-path";
import { isAllowedImageSrc } from "@/config/images";
import { recordIdSchema } from "./owned-media.schema";
import { sessionInputSchema } from "./schedule.schema";
import { listingDetailsSchema } from "./listing.schema";
import { z } from "zod";
import type {
  CollectionMap,
  CollectionName,
  Page,
} from "@/types/service-contracts";
import { featuredSchema } from "./home.schema";
import { engagementSchemas } from "./engagement.schemas";
import { lifeSchemas } from "./life.schemas";
const text = z.string();
export const entitySchemas: {
  [K in CollectionName]: z.ZodType<CollectionMap[K]>;
} = {
  featured: featuredSchema,
  ...engagementSchemas,
  ...lifeSchemas,
  resources: z.object({
    details: listingDetailsSchema.optional(),
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
    id: recordIdSchema,
    author: z.string().min(1).max(80),
    body: z.string().min(1).max(3000),
    createdAt: z.iso.datetime(),
    likes: z.number().int().nonnegative(),
    comments: z.number().int().nonnegative(),
    details: z
      .object({
        topic: z.string().max(80),
        cover: z
          .object({
            src: z.string().refine(isAllowedImageSrc),
            alt: z.string().min(1).max(400),
            provenance: z.enum([
              "generated",
              "placeholder",
              "licensed",
              "upload",
            ]),
            width: z.number().positive().optional(),
            height: z.number().positive().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
  conversations: z.object({
    id: recordIdSchema,
    name: text,
    lastMessage: text,
    updatedAt: text,
  }),
  notifications: z.object({
    id: text,
    title: text,
    description: text,
    href: z
      .string()
      .refine(
        (value) => studentReturnPath(value) === value,
        "Unsupported notification destination",
      ),
    read: z.boolean(),
    category: z.enum(["tasks", "events", "clubs", "announcement"]),
  }),
  timetable: sessionInputSchema.safeExtend({ id: text }),
};
export function pageSchema<T>(entity: z.ZodType<T>): z.ZodType<Page<T>> {
  return z
    .object({
      items: z.array(entity),
      total: z.number().int().nonnegative(),
      page: z.number().int().min(1),
      pageSize: z.number().int().min(1).max(30),
    })
    .transform((page) => ({
      ...page,
      hasMore: page.page * page.pageSize < page.total,
    }));
}
