import { z } from "zod";
import { isAllowedImageSrc } from "../../config/image-policy";
const label = z.string().min(1).max(240);
export const clubImageSourceSchema = z
  .string()
  .max(2048)
  .refine(
    (value) => !value.startsWith("blob:") && isAllowedImageSrc(value),
    "Unapproved club photo",
  );
const source = clubImageSourceSchema;
export const clubDetailsSchema = z.object({
  tagline: label,
  coverAlt: z.string().min(8).max(500),
  memberCount: z.number().int().nonnegative().max(1000000),
  meeting: label,
  venue: label,
  fee: z.number().nonnegative().max(100000),
  founded: z.number().int().min(1900).max(2100),
  accepting: z.boolean(),
  rank: z.number().int().nonnegative().max(100000),
  story: z.array(z.string().min(1).max(2000)).max(8),
  highlights: z.array(label).max(12),
  leaders: z.array(z.object({ name: label, role: label, avatar: source.optional() })).max(12),
  gallery: z.array(z.object({ src: source, alt: z.string().min(8).max(500) })).max(12),
});
export const membershipSchema = z.object({
  id: z.string().min(1).max(100),
  clubId: z.string().min(1).max(100),
  userId: z.string().min(1).max(100),
  status: z.enum(["pending", "approved", "rejected"]),
  applicantName: z.string().max(80).optional(),
  note: z.string().max(400).optional(),
  requestedAt: z.iso.date().optional(),
});
export const clubActivitySchema = z.object({
  memberships: z.array(membershipSchema).max(500),
  savedIds: z.array(z.string().min(1).max(100)).max(500),
});

export const membershipNoteSchema = z
  .string()
  .trim()
  .max(400, "Keep your introduction to 400 characters or fewer.")
  .refine(
    (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value),
    "Use plain text for your introduction.",
  );
