import { z } from "zod";
import { recordIdSchema, ownedPhotoSchema } from "./owned-media.schema";
export const postInputSchema = z.object({
  body: z.string().trim().min(5, "Share at least five characters.").max(3000),
  topic: z.enum(["Campus life", "Study", "Clubs", "Events", "Opportunities"]),
});
export const postRecordSchema = postInputSchema.extend({
  id: recordIdSchema,
  author: z.string().min(1).max(80),
  createdAt: z.iso.datetime(),
  photo: ownedPhotoSchema.optional(),
});
export const replyInputSchema = z.object({
  body: z.string().trim().min(2).max(1500),
});
export const replyRecordSchema = replyInputSchema.extend({
  id: recordIdSchema,
  postId: recordIdSchema,
  parentId: recordIdSchema.optional(),
  author: z.string().min(1).max(80),
  createdAt: z.iso.datetime(),
});
export const reactionSchema = z.object({
  id: recordIdSchema,
  postId: recordIdSchema,
  kind: z.enum(["like", "celebrate", "useful"]),
});
export const concernInputSchema = z.object({
  reason: z.enum(["spam", "harassment", "privacy", "other"]),
  note: z.string().trim().min(10).max(1500),
});
export const concernSchema = concernInputSchema.extend({
  id: recordIdSchema,
  targetId: recordIdSchema,
  area: z.enum(["community", "messages"]),
  createdAt: z.iso.datetime(),
});
export const messageInputSchema = z.object({
  body: z.string().trim().min(1, "Add a message or a photo caption.").max(2000),
});
export const messageSchema = messageInputSchema.extend({
  id: recordIdSchema,
  conversationId: recordIdSchema,
  author: z.literal("you"),
  createdAt: z.iso.datetime(),
  photo: ownedPhotoSchema.optional(),
});
export const conversationInputSchema = z.object({
  name: z.string().trim().min(3).max(80),
});
export const conversationSchema = conversationInputSchema.extend({
  id: recordIdSchema,
  createdAt: z.iso.datetime(),
});
