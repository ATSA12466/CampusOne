// Node-safe campus domain: memberships, saves, RSVPs, club events, officers,
// resources and analytics. Shapes align with the client API contracts.
import { z } from "zod";
import { newId } from "./crypto";
import { store } from "./store";
import { eventItemSchema } from "../services/validation/event.schema";
import { membershipSchema } from "../services/validation/club.schema";
import { campusDate } from "../lib/home/schedule";

export type Membership = z.infer<typeof membershipSchema>;

// ---------- Memberships ----------

const membershipRowSchema = membershipSchema.extend({
  decidedBy: z.string().max(80).default(""),
  decidedAt: z.string().max(40).default(""),
});
export type MembershipRow = z.infer<typeof membershipRowSchema>;

// ---------- Saves ----------

export const saveSchema = z.object({
  userId: z.string().min(1).max(80),
  kind: z.enum(["club", "event"]),
  entityId: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
});
export type Save = z.infer<typeof saveSchema>;

// ---------- RSVPs ----------

export const rsvpSchema = z.object({
  id: z.string().min(1).max(80),
  eventId: z.string().min(1).max(100),
  userId: z.string().min(1).max(80),
  userName: z.string().max(120),
  status: z.enum(["going", "cancelled"]),
  ticketRef: z.string().min(4).max(40),
  createdAt: z.string().datetime(),
});
export type Rsvp = z.infer<typeof rsvpSchema>;

// ---------- Campus events (server-created) ----------

export const campusEventInputSchema = z.object({
  clubId: z.string().trim().max(100).default(""),
  title: z.string().trim().min(4).max(240),
  venue: z.string().trim().min(2).max(240),
  category: z.string().trim().min(2).max(120),
  seats: z.number().int().min(1).max(100000),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  bookingClosesAt: z.iso.datetime({ offset: true }).optional(),
  price: z.number().nonnegative().max(100000).default(0),
  tagline: z.string().trim().min(4).max(240),
  description: z.string().trim().min(10).max(4000),
  coverAlt: z.string().trim().min(8).max(500).default(""),
  highlights: z.array(z.string().trim().min(1).max(240)).max(12).default([]),
  accessibility: z.array(z.string().trim().min(1).max(240)).max(8).default([]),
});

const campusEventMetaSchema = z.object({
  clubId: z.string().max(100),
  organizerId: z.string().max(80),
  organizerName: z.string().max(120),
  visibility: z.enum(["published", "cancelled"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const campusEventRowSchema = z.object({
  id: z.string().min(1).max(100),
  event: eventItemSchema,
  meta: campusEventMetaSchema,
});
export type CampusEventRow = z.infer<typeof campusEventRowSchema>;
export type CampusEventItem = z.infer<typeof eventItemSchema>;

// ---------- Officers & resources ----------

export const officerSchema = z.object({
  id: z.string().min(1).max(80),
  clubId: z.string().min(1).max(100),
  userId: z.string().max(80).default(""),
  name: z.string().trim().min(2).max(120),
  position: z.string().trim().min(2).max(80),
  committee: z.string().trim().max(80).default(""),
  startsAt: z.string().max(40),
  endsAt: z.string().max(40).default(""),
  status: z.enum(["active", "ended"]),
  appointedBy: z.string().max(80),
  createdAt: z.string().datetime(),
});
export type Officer = z.infer<typeof officerSchema>;

export const officerInputSchema = officerSchema.pick({
  name: true,
  position: true,
  committee: true,
  startsAt: true,
  endsAt: true,
  userId: true,
});

export const resourceSchema = z.object({
  id: z.string().min(1).max(80),
  clubId: z.string().min(1).max(100),
  title: z.string().trim().min(3).max(200),
  kind: z.enum(["constitution", "minutes", "plan", "report", "training", "handover", "other"]),
  url: z.string().trim().max(1000).default(""),
  body: z.string().trim().max(5000).default(""),
  createdBy: z.string().max(80),
  createdAt: z.string().datetime(),
});
export type ClubResource = z.infer<typeof resourceSchema>;

export const resourceInputSchema = resourceSchema.pick({ title: true, kind: true, url: true, body: true });

// ---------- Repository ----------

function now(): string {
  return new Date().toISOString();
}

function today(): string {
  return now().slice(0, 10);
}

function ticketRef(): string {
  return `C1-${newId("t").slice(2, 10).toUpperCase()}`;
}

export const campus = {
  // Memberships
  listMemberships: (clubId: string) =>
    store
      .filter<MembershipRow>("memberships", (m) => m.clubId === clubId)
      .sort((a, b) => (b.requestedAt ?? "").localeCompare(a.requestedAt ?? "")),
  userMemberships: (userId: string) =>
    store.filter<MembershipRow>("memberships", (m) => m.userId === userId),
  getMembership: (id: string) => store.find<MembershipRow>("memberships", (m) => m.id === id),
  requestMembership: async (
    clubId: string,
    user: { id: string; name: string },
    note: string,
  ): Promise<MembershipRow> => {
    const existing = store.find<MembershipRow>(
      "memberships",
      (m) => m.clubId === clubId && m.userId === user.id && m.status !== "rejected",
    );
    if (existing) return existing;
    const row = membershipRowSchema.parse({
      id: newId("mem"),
      clubId,
      userId: user.id,
      status: "pending",
      applicantName: user.name.slice(0, 80),
      note: note.slice(0, 400),
      requestedAt: today(),
      decidedBy: "",
      decidedAt: "",
    });
    await store.insert("memberships", row);
    return row;
  },
  withdrawMembership: (clubId: string, userId: string) =>
    store.remove<MembershipRow>(
      "memberships",
      (m) => m.clubId === clubId && m.userId === userId && m.status === "pending",
    ),
  leaveClub: (clubId: string, userId: string) =>
    store.remove<MembershipRow>("memberships", (m) => m.clubId === clubId && m.userId === userId),
  reviewMembership: async (
    id: string,
    status: "approved" | "rejected",
    by: string,
  ): Promise<MembershipRow | null> => {
    const existing = store.find<MembershipRow>("memberships", (m) => m.id === id);
    if (!existing || existing.status !== "pending") return existing ?? null;
    const row = membershipRowSchema.parse({
      ...existing,
      status,
      decidedBy: by,
      decidedAt: today(),
    });
    await store.update<MembershipRow>("memberships", (m) => m.id === id, row);
    return row;
  },

  // Saves
  userSaves: (userId: string, kind: "club" | "event") =>
    store
      .filter<Save>("saves", (s) => s.userId === userId && s.kind === kind)
      .map((s) => s.entityId),
  setSaved: async (userId: string, kind: "club" | "event", entityId: string, saved: boolean) => {
    if (saved) {
      const existing = store.find<Save>(
        "saves",
        (s) => s.userId === userId && s.kind === kind && s.entityId === entityId,
      );
      if (!existing)
        await store.insert("saves", saveSchema.parse({ userId, kind, entityId, createdAt: now() }));
    } else {
      await store.remove<Save>(
        "saves",
        (s) => s.userId === userId && s.kind === kind && s.entityId === entityId,
      );
    }
  },

  // RSVPs
  userRsvps: (userId: string) =>
    store.filter<Rsvp>("rsvps", (r) => r.userId === userId && r.status === "going"),
  eventRsvpCount: (eventId: string) =>
    store.filter<Rsvp>("rsvps", (r) => r.eventId === eventId && r.status === "going").length,
  getRsvp: (eventId: string, userId: string) =>
    store.find<Rsvp>("rsvps", (r) => r.eventId === eventId && r.userId === userId && r.status === "going"),
  setRsvp: async (
    event: { id: string; seats: number; baseRegistered: number },
    user: { id: string; name: string },
    going: boolean,
  ): Promise<{ ok: true; rsvp: Rsvp | null } | { ok: false; reason: string }> => {
    if (!going) {
      await store.remove<Rsvp>(
        "rsvps",
        (r) => r.eventId === event.id && r.userId === user.id && r.status === "going",
      );
      return { ok: true, rsvp: null };
    }
    const existing = store.find<Rsvp>(
      "rsvps",
      (r) => r.eventId === event.id && r.userId === user.id && r.status === "going",
    );
    if (existing) return { ok: true, rsvp: existing };
    const total = event.baseRegistered + campus.eventRsvpCount(event.id);
    if (total >= event.seats) return { ok: false, reason: "This event is fully booked." };
    const rsvp = rsvpSchema.parse({
      id: newId("rsvp"),
      eventId: event.id,
      userId: user.id,
      userName: user.name.slice(0, 120),
      status: "going",
      ticketRef: ticketRef(),
      createdAt: now(),
    });
    await store.insert("rsvps", rsvp);
    return { ok: true, rsvp };
  },

  // Campus events
  listCampusEvents: (visibility?: string) =>
    store
      .filter<CampusEventRow>("campus_events", (r) => !visibility || r.meta.visibility === visibility)
      .sort((a, b) => a.event.date.localeCompare(b.event.date)),
  getCampusEvent: (id: string) => store.find<CampusEventRow>("campus_events", (r) => r.id === id),
  createCampusEvent: async (
    input: unknown,
    organizer: { id: string; name: string },
  ): Promise<CampusEventItem> => {
    const parsed = campusEventInputSchema.parse(input);
    const id = `evt-${newId("e").slice(2, 14)}`;
    const startsAt = parsed.startsAt;
    const event = eventItemSchema.parse({
      id,
      title: parsed.title,
      venue: parsed.venue,
      date: campusDate(new Date(startsAt)),
      category: parsed.category,
      seats: parsed.seats,
      registered: 0,
      details: {
        cover: "/images/demo/event-showcase.webp",
        coverAlt: parsed.coverAlt || `${parsed.title} event photograph`,
        tagline: parsed.tagline,
        description: parsed.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).slice(0, 8),
        startsAt: parsed.startsAt,
        endsAt: parsed.endsAt,
        bookingClosesAt: parsed.bookingClosesAt ?? parsed.startsAt,
        timeZone: "Africa/Accra",
        price: parsed.price,
        organizer: parsed.clubId || organizer.name,
        status: "scheduled",
        rank: 0,
        highlights: parsed.highlights,
        agenda: [],
        speakers: [],
        accessibility: parsed.accessibility,
        gallery: [],
      },
    });
    const row = campusEventRowSchema.parse({
      id,
      event,
      meta: {
        clubId: parsed.clubId,
        organizerId: organizer.id,
        organizerName: organizer.name,
        visibility: "published",
        createdAt: now(),
        updatedAt: now(),
      },
    });
    await store.insert("campus_events", row as unknown as Record<string, unknown>);
    return event;
  },
  cancelCampusEvent: async (id: string): Promise<CampusEventRow | null> => {
    const existing = store.find<CampusEventRow>("campus_events", (r) => r.id === id);
    if (!existing) return null;
    const row = campusEventRowSchema.parse({
      ...existing,
      event: { ...existing.event, details: { ...existing.event.details, status: "cancelled" } },
      meta: { ...existing.meta, visibility: "cancelled", updatedAt: now() },
    });
    await store.update<CampusEventRow>("campus_events", (r) => r.id === id, row);
    return row;
  },

  // Officers
  listOfficers: (clubId: string) =>
    store
      .filter<Officer>("officers", (o) => o.clubId === clubId)
      .sort((a, b) => a.position.localeCompare(b.position)),
  addOfficer: async (clubId: string, input: unknown, by: string): Promise<Officer> => {
    const row = officerSchema.parse({
      ...officerInputSchema.parse(input),
      id: newId("off"),
      clubId,
      status: "active",
      appointedBy: by,
      createdAt: now(),
    });
    await store.insert("officers", row);
    return row;
  },
  endTenure: async (clubId: string, id: string): Promise<Officer | null> => {
    const existing = store.find<Officer>("officers", (o) => o.id === id && o.clubId === clubId);
    if (!existing) return null;
    const row = officerSchema.parse({ ...existing, status: "ended", endsAt: today() });
    await store.update<Officer>("officers", (o) => o.id === id, row);
    return row;
  },

  // Resources
  listResources: (clubId: string) =>
    store
      .filter<ClubResource>("resources", (r) => r.clubId === clubId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  addResource: async (clubId: string, input: unknown, by: string): Promise<ClubResource> => {
    const row = resourceSchema.parse({
      ...resourceInputSchema.parse(input),
      id: newId("res"),
      clubId,
      createdBy: by,
      createdAt: now(),
    });
    await store.insert("resources", row);
    return row;
  },
  deleteResource: (clubId: string, id: string) =>
    store.remove<ClubResource>("resources", (r) => r.id === id && r.clubId === clubId),

  // Analytics (real records only)
  analytics: (clubId: string) => {
    const memberships = campus.listMemberships(clubId);
    const approved = memberships.filter((m) => m.status === "approved");
    const weeks: { week: string; members: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date(Date.now() - i * 7 * 86_400_000).toISOString().slice(0, 10);
      weeks.push({ week: date, members: 0 });
    }
    for (const member of approved) {
      const day = (member.decidedAt || member.requestedAt || "").slice(0, 10);
      const bucket = weeks.find((w) => day >= w.week);
      if (bucket) bucket.members += 1;
    }
    let running = 0;
    const growth = weeks.map((w) => {
      running += w.members;
      return { week: w.week, members: running };
    });
    const events = campus.listCampusEvents("published").filter((e) => e.meta.clubId === clubId);
    const rsvps = events.map((e) => ({ eventId: e.id, title: e.event.title, going: campus.eventRsvpCount(e.id) }));
    return {
      members: approved.length,
      pending: memberships.filter((m) => m.status === "pending").length,
      growth,
      eventsHosted: events.length,
      totalRsvps: rsvps.reduce((sum, r) => sum + r.going, 0),
      rsvps,
    };
  },
};
