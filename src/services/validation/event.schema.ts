import { z } from "zod";
import { isAllowedImageSrc } from "../../config/image-policy";
import { campusDate } from "../../lib/home/schedule";
const text = z.string().min(1).max(240),
  instant = z.iso.datetime({ offset: true }).max(40);
const photo = z
  .string()
  .max(2048)
  .refine(
    (value) => !value.startsWith("blob:") && isAllowedImageSrc(value),
    "Unapproved event photograph",
  );
export const eventDetailsSchema = z
  .object({
    cover: photo,
    coverAlt: z.string().min(8).max(500),
    tagline: text,
    description: z.array(z.string().min(1).max(2000)).max(8),
    startsAt: instant,
    endsAt: instant,
    bookingClosesAt: instant,
    timeZone: z.literal("Africa/Accra"),
    price: z.number().nonnegative().max(100000),
    organizer: text,
    status: z.enum(["scheduled", "cancelled"]),
    rank: z.number().int().nonnegative().max(100000),
    highlights: z.array(text).max(12),
    agenda: z
      .array(z.object({ title: text, startsAt: instant, description: z.string().max(600) }))
      .max(12),
    speakers: z.array(z.object({ name: text, role: text, avatar: photo.optional() })).max(12),
    accessibility: z.array(text).max(8),
    gallery: z.array(z.object({ src: photo, alt: z.string().min(8).max(500) })).max(12),
  })
  .refine(
    (value) =>
      Date.parse(value.endsAt) > Date.parse(value.startsAt) &&
      Date.parse(value.endsAt) - Date.parse(value.startsAt) <= 7 * 86400000,
    "Event end must follow its start within seven days.",
  )
  .refine(
    (value) => Date.parse(value.bookingClosesAt) <= Date.parse(value.endsAt),
    "Booking deadline must not follow event end.",
  )
  .refine(
    (value) =>
      value.agenda.every(
        (item) =>
          Date.parse(item.startsAt) >= Date.parse(value.startsAt) &&
          Date.parse(item.startsAt) < Date.parse(value.endsAt),
      ),
    "Agenda entries must be inside the event.",
  );
export const eventItemSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .max(100)
      .refine(
        (value) =>
          !!value.trim() &&
          value !== "." &&
          !value.includes("..") &&
          !/[\/\\#\u0000-\u001f\u007f]/.test(value),
        "Event IDs must support the existing detail-route contract.",
      ),
    title: text,
    venue: text,
    date: z.iso.date(),
    category: text,
    seats: z.number().int().nonnegative().max(1000000),
    registered: z.number().int().nonnegative().max(1000000),
    details: eventDetailsSchema.optional(),
  })
  .refine((value) => value.registered <= value.seats, "Attendance must not exceed capacity.")
  .refine(
    (value) => !value.details || campusDate(new Date(value.details.startsAt)) === value.date,
    "Event date must match its Accra start date.",
  );
export const eventActivitySchema = z.object({
  goingIds: z.array(z.string().min(1).max(100)).max(500),
  savedIds: z.array(z.string().min(1).max(100)).max(500),
  attendance: z
    .array(
      z.object({
        eventId: z.string().min(1).max(100),
        registered: z.number().int().nonnegative().max(1000000),
      }),
    )
    .max(500)
    .default([]),
});
export const eventTicketSchema = z.object({
  eventId: z.string().min(1).max(100),
  reference: z.string().min(1).max(100),
  payload: z
    .string()
    .min(8)
    .max(1024)
    .refine(
      (value) => new TextEncoder().encode(value).length <= 1400,
      "Ticket payload is too large for a readable QR.",
    ),
  status: z.enum(["valid", "revoked"]),
});
