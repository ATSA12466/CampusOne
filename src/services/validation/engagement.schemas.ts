import { listingDetailsSchema } from "./listing.schema";
import { eventItemSchema } from "./event.schema";
import { clubDetailsSchema, clubImageSourceSchema } from "./club.schema";
import { z } from "zod";
const text = z.string();
const date = z.iso.date();
const bounded = z.string().trim().min(1).max(240);
const safeId = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
export const engagementSchemas = {
  clubs: z.object({
    id: text,
    name: text,
    category: text,
    description: text,
    cover: clubImageSourceSchema,
    objectives: z.array(text),
    details: clubDetailsSchema.optional(),
  }),
  events: eventItemSchema,
  opportunities: z.object({
    details: listingDetailsSchema.optional(),
    id: text,
    title: text,
    provider: text,
    category: text,
    deadline: date,
    summary: text,
  }),
  announcements: z.object({
    id: safeId,
    title: bounded,
    content: z.string().max(8000),
    category: z.enum(["src", "campus", "club"]),
    pinned: z.boolean(),
    publishedAt: date,
  }),
  representatives: z.object({
    id: safeId,
    name: bounded,
    role: bounded,
    responsibility: z.string().max(2000),
  }),
  projects: z.object({
    id: safeId,
    title: bounded,
    status: z.enum(["planning", "active", "in-progress", "completed"]),
    summary: z.string().max(2000),
  }),
  campaigns: z.object({
    id: safeId,
    title: bounded,
    advertiser: bounded,
    placement: bounded,
    status: z.enum(["draft", "active", "scheduled"]),
    startDate: date,
    endDate: date,
  }),
};
