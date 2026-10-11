import { clubDetailsSchema, clubImageSourceSchema } from "./club.schema";
import { z } from "zod";
const text = z.string();
const date = z.iso.date();
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
  events: z.object({
    id: text,
    title: text,
    venue: text,
    date,
    category: text,
    seats: z.number().nonnegative(),
    registered: z.number().nonnegative(),
  }),
  opportunities: z.object({
    id: text,
    title: text,
    provider: text,
    category: text,
    deadline: date,
    summary: text,
  }),
  announcements: z.object({
    id: text,
    title: text,
    content: text,
    category: z.enum(["src", "campus", "club"]),
    pinned: z.boolean(),
    publishedAt: text,
  }),
  representatives: z.object({ id: text, name: text, role: text, responsibility: text }),
  projects: z.object({
    id: text,
    title: text,
    status: z.enum(["planning", "active", "in-progress", "completed"]),
    summary: text,
  }),
  campaigns: z.object({
    id: text,
    title: text,
    advertiser: text,
    placement: text,
    status: z.enum(["draft", "active", "scheduled"]),
    startDate: date,
    endDate: date,
  }),
};
