// Node-safe SRC domain registry: club registrations, nominations, appointments,
// announcements, student requests and SRC office profiles. All writes validated.
import { z } from "zod";
import { newId } from "./crypto";
import { store, type CollectionName } from "./store";

// ---------- Club registrations ----------

export const clubRegistrationSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(3).max(120),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(20).max(2000),
  objectives: z.array(z.string().trim().min(3).max(200)).max(8).default([]),
  submittedBy: z.string().max(80),
  submittedByName: z.string().max(120),
  status: z.enum(["pending", "approved", "rejected"]),
  note: z.string().max(1000).default(""),
  decidedBy: z.string().max(80).nullable().default(null),
  decidedAt: z.string().datetime().nullable().default(null),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ClubRegistration = z.infer<typeof clubRegistrationSchema>;

export const clubSubmitSchema = z.object({
  name: z.string().trim().min(3).max(120),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(20).max(2000),
  objectives: z.array(z.string().trim().min(3).max(200)).max(8).default([]),
});

export const clubDecisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(1000).default(""),
});

// ---------- Nominations & appointments ----------

export const nominationSchema = z.object({
  id: z.string().min(1).max(80),
  clubId: z.string().max(80).default(""),
  clubName: z.string().trim().min(2).max(120),
  position: z.string().trim().min(2).max(80),
  nomineeName: z.string().trim().min(2).max(120),
  nomineeEmail: z.union([z.literal(""), z.string().trim().toLowerCase().email().max(254)]).default(""),
  nomineeUserId: z.string().max(80).default(""),
  statement: z.string().trim().max(2000).default(""),
  status: z.enum(["pending", "approved", "rejected"]),
  submittedBy: z.string().max(80),
  submittedByName: z.string().max(120),
  decidedBy: z.string().max(80).nullable().default(null),
  decidedAt: z.string().datetime().nullable().default(null),
  note: z.string().max(1000).default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Nomination = z.infer<typeof nominationSchema>;

export const nominationSubmitSchema = nominationSchema.pick({
  clubId: true,
  clubName: true,
  position: true,
  nomineeName: true,
  nomineeEmail: true,
  nomineeUserId: true,
  statement: true,
});

export const appointmentSchema = z.object({
  id: z.string().min(1).max(80),
  scopeType: z.enum(["club", "src"]),
  scopeId: z.string().max(80).default(""),
  scopeName: z.string().trim().min(2).max(120),
  position: z.string().trim().min(2).max(80),
  appointeeName: z.string().trim().min(2).max(120),
  appointeeUserId: z.string().max(80).default(""),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable().default(null),
  status: z.enum(["active", "revoked", "expired"]),
  appointedBy: z.string().max(80),
  revokedBy: z.string().max(80).nullable().default(null),
  revokedAt: z.string().datetime().nullable().default(null),
  revokeReason: z.string().max(1000).default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Appointment = z.infer<typeof appointmentSchema>;

export const appointmentCreateSchema = appointmentSchema.pick({
  scopeType: true,
  scopeId: true,
  scopeName: true,
  position: true,
  appointeeName: true,
  appointeeUserId: true,
  startsAt: true,
  endsAt: true,
});

export const appointmentRevokeSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

// ---------- Announcements ----------

export const announcementSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().min(4).max(160),
  body: z.string().trim().min(10).max(5000),
  audience: z.enum(["all", "freshers", "clubs", "src"]),
  status: z.enum(["draft", "published", "expired"]),
  publishAt: z.string().datetime().nullable().default(null),
  expireAt: z.string().datetime().nullable().default(null),
  authorId: z.string().max(80),
  authorName: z.string().max(120),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Announcement = z.infer<typeof announcementSchema>;

export const announcementWriteSchema = announcementSchema.pick({
  title: true,
  body: true,
  audience: true,
  status: true,
  publishAt: true,
  expireAt: true,
});

// ---------- Student requests ----------

export const studentRequestSchema = z.object({
  id: z.string().min(1).max(80),
  category: z.string().trim().min(2).max(60),
  subject: z.string().trim().min(4).max(160),
  body: z.string().trim().min(10).max(3000),
  contact: z.string().trim().max(160).default(""),
  status: z.enum(["new", "in-review", "resolved", "closed"]),
  submittedBy: z.string().max(80).default(""),
  submittedByName: z.string().max(120).default(""),
  assignee: z.string().max(120).default(""),
  resolution: z.string().max(2000).default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type StudentRequest = z.infer<typeof studentRequestSchema>;

export const studentRequestSubmitSchema = studentRequestSchema.pick({
  category: true,
  subject: true,
  body: true,
  contact: true,
});

export const studentRequestTriageSchema = z.object({
  status: z.enum(["new", "in-review", "resolved", "closed"]),
  assignee: z.string().trim().max(120).default(""),
  resolution: z.string().trim().max(2000).default(""),
});

// ---------- SRC office profiles ----------

export const srcProfileSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(2).max(120),
  position: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(2000).default(""),
  photoUrl: z.string().trim().max(500).default(""),
  email: z.string().trim().max(254).default(""),
  order: z.number().int().min(0).max(100).default(10),
  active: z.boolean().default(true),
  updatedAt: z.string().datetime(),
});
export type SrcProfile = z.infer<typeof srcProfileSchema>;

export const srcProfileWriteSchema = srcProfileSchema.pick({
  name: true,
  position: true,
  bio: true,
  photoUrl: true,
  email: true,
  order: true,
  active: true,
});

// ---------- Repository helpers ----------

function now(): string {
  return new Date().toISOString();
}

async function create<T extends object>(
  collection: CollectionName,
  schema: z.ZodType<T>,
  prefix: string,
  input: unknown,
  extra: Record<string, unknown> = {},
): Promise<T> {
  const row = schema.parse({ ...(input as object), id: newId(prefix), ...extra });
  await store.insert(collection, row as T);
  return row;
}

async function patch<T extends object>(
  collection: CollectionName,
  schema: z.ZodType<T>,
  id: string,
  input: unknown,
): Promise<T | null> {
  const existing = store.find<T & { id: string }>(collection, (r) => r.id === id);
  if (!existing) return null;
  const row = schema.parse({ ...existing, ...(input as object), updatedAt: now() });
  await store.update<T & { id: string }>(
    collection,
    (r) => r.id === id,
    row as Partial<T & { id: string }>,
  );
  return row;
}

export const registry = {
  // Clubs
  listClubs: (status?: string) =>
    store
      .filter<ClubRegistration>("clubs", (r) => !status || r.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  submitClub: async (input: unknown, by: { id: string; name: string }) =>
    create("clubs", clubRegistrationSchema, "club", clubSubmitSchema.parse(input), {
      submittedBy: by.id,
      submittedByName: by.name,
      status: "pending",
      note: "",
      decidedBy: null,
      decidedAt: null,
      createdAt: now(),
      updatedAt: now(),
    }),
  decideClub: async (id: string, input: unknown, by: string) => {
    const decision = clubDecisionSchema.parse(input);
    return patch("clubs", clubRegistrationSchema, id, {
      status: decision.status,
      note: decision.note,
      decidedBy: by,
      decidedAt: now(),
    });
  },

  // Nominations
  listNominations: (status?: string) =>
    store
      .filter<Nomination>("nominations", (r) => !status || r.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  submitNomination: async (input: unknown, by: { id: string; name: string }) =>
    create("nominations", nominationSchema, "nom", nominationSubmitSchema.parse(input), {
      status: "pending",
      submittedBy: by.id,
      submittedByName: by.name,
      decidedBy: null,
      decidedAt: null,
      note: "",
      createdAt: now(),
      updatedAt: now(),
    }),
  decideNomination: async (id: string, input: unknown, by: string) => {
    const decision = clubDecisionSchema.parse(input);
    return patch("nominations", nominationSchema, id, {
      status: decision.status,
      note: decision.note,
      decidedBy: by,
      decidedAt: now(),
    });
  },

  // Appointments
  listAppointments: (status?: string) =>
    store
      .filter<Appointment>("appointments", (r) => !status || r.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  createAppointment: async (input: unknown, by: string) =>
    create("appointments", appointmentSchema, "appt", appointmentCreateSchema.parse(input), {
      status: "active",
      appointedBy: by,
      revokedBy: null,
      revokedAt: null,
      revokeReason: "",
      createdAt: now(),
      updatedAt: now(),
    }),
  revokeAppointment: async (id: string, input: unknown, by: string) =>
    patch("appointments", appointmentSchema, id, {
      status: "revoked",
      revokedBy: by,
      revokedAt: now(),
      revokeReason: appointmentRevokeSchema.parse(input).reason,
    }),

  // Announcements
  listAnnouncements: (status?: string) =>
    store
      .filter<Announcement>("announcements", (r) => !status || r.status === status)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  publishedAnnouncements: () => {
    const at = now();
    return store
      .filter<Announcement>(
        "announcements",
        (r) =>
          r.status === "published" &&
          (!r.publishAt || r.publishAt <= at) &&
          (!r.expireAt || r.expireAt > at),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  createAnnouncement: async (input: unknown, by: { id: string; name: string }) =>
    create("announcements", announcementSchema, "ann", announcementWriteSchema.parse(input), {
      authorId: by.id,
      authorName: by.name,
      createdAt: now(),
      updatedAt: now(),
    }),
  updateAnnouncement: async (id: string, input: unknown) =>
    patch("announcements", announcementSchema, id, announcementWriteSchema.parse(input)),
  deleteAnnouncement: (id: string) =>
    store.remove<Announcement>("announcements", (r) => r.id === id),

  // Requests
  listRequests: (status?: string) =>
    store
      .filter<StudentRequest>("requests", (r) => !status || r.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  submitRequest: async (input: unknown, by: { id: string; name: string }) =>
    create("requests", studentRequestSchema, "req", studentRequestSubmitSchema.parse(input), {
      status: "new",
      submittedBy: by.id,
      submittedByName: by.name,
      assignee: "",
      resolution: "",
      createdAt: now(),
      updatedAt: now(),
    }),
  triageRequest: async (id: string, input: unknown) =>
    patch("requests", studentRequestSchema, id, studentRequestTriageSchema.parse(input)),

  // SRC profiles
  listProfiles: () =>
    store
      .all<SrcProfile>("src_profiles")
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
  activeProfiles: () => registry.listProfiles().filter((p) => p.active),
  saveProfile: async (input: unknown) => {
    const parsed = srcProfileWriteSchema.parse(input);
    return create("src_profiles", srcProfileSchema, "src", parsed, { updatedAt: now() });
  },
  updateProfile: async (id: string, input: unknown) =>
    patch("src_profiles", srcProfileSchema, id, srcProfileWriteSchema.parse(input)),
  deleteProfile: (id: string) => store.remove<SrcProfile>("src_profiles", (r) => r.id === id),
};
