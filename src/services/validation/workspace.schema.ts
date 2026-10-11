import { recordIdSchema, ownedPhotoSchema } from "./owned-media.schema";
export { recordIdSchema, ownedPhotoSchema } from "./owned-media.schema";
import {
  postRecordSchema,
  replyRecordSchema,
  reactionSchema,
  concernSchema,
  messageSchema,
  conversationSchema,
} from "./social.schema";
import { profileInputSchema } from "./profile.schema";
import { sessionInputSchema, planInputSchema } from "./schedule.schema";
import { z } from "zod";
import type { WorkspaceMap } from "@/types/workspace";
export const enquiryInputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(15, "Please add at least 15 characters.")
    .max(1500),
  consent: z.literal("yes", {
    error: "Confirm the local-demo / service notice.",
  }),
});
export const photoRecordInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(2000),
  category: z.string().trim().min(3).max(80),
  location: z.string().trim().min(3).max(120),
  priceValue: z.coerce.number().min(0).max(1000000),
  type: z.enum(["listing", "lost", "found"]),
});
export const photoRecordSchema = photoRecordInputSchema.extend({
  id: recordIdSchema,
  photo: ownedPhotoSchema,
  createdAt: z.iso.datetime(),
  status: z.enum(["open", "closed"]),
});
export const noteInputSchema = z.object({
  course: z.string().trim().min(2).max(80),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(10000),
});
export const gradeInputSchema = z.object({
  course: z.string().trim().min(2).max(80),
  term: z.string().trim().min(2).max(80),
  credits: z.coerce.number().int().min(1).max(40),
  points: z.preprocess(
    (value) => (typeof value === "string" && !value.trim() ? NaN : value),
    z.coerce.number().min(0).max(4),
  ),
});
export const workspaceSchemas: {
  [K in keyof WorkspaceMap]: z.ZodType<WorkspaceMap[K]>;
} = {
  communityPosts: postRecordSchema,
  replies: replyRecordSchema,
  reactions: reactionSchema,
  concerns: concernSchema,
  messages: messageSchema,
  conversations: conversationSchema,
  profile: profileInputSchema.extend({
    id: z.literal("profile"),
    photo: ownedPhotoSchema.optional(),
  }),
  sessions: sessionInputSchema.safeExtend({ id: recordIdSchema }),
  plans: planInputSchema.safeExtend({ id: recordIdSchema }),
  notes: noteInputSchema.extend({
    id: recordIdSchema,
    createdAt: z.iso.datetime(),
  }),
  grades: gradeInputSchema.extend({ id: recordIdSchema }),
  marketPosts: photoRecordSchema,
  reports: photoRecordSchema,
  enquiries: z.object({
    id: recordIdSchema,
    category: z.enum([
      "accommodation",
      "marketplace",
      "opportunities",
      "resources",
      "lost-found",
    ]),
    listingId: recordIdSchema,
    message: z.string().min(15).max(1500),
    intent: z.enum(["enquiry", "report", "application"]),
    createdAt: z.iso.datetime(),
  }),
};
