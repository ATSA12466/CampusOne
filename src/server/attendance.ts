// Node-safe QR attendance: exec-created sessions, rotating HMAC codes,
// server-validated check-ins with eligibility, duplicates, expiry, revocation
// and auditable corrections. QR payloads carry no student PII.
import { z } from "zod";
import { hmacSign, hmacVerify, newId, newToken, sha256 } from "./crypto";
import { store } from "./store";
import { campus } from "./campus";
import { notify } from "./notify";
import { evaluateBadges, type BadgeAward, type BadgeDefinition } from "./badges";

export const QR_VERSION = "C1A1";
export const QR_SLOT_SECONDS = 60;
const SECRET_SETTING_KEY = "secret.qr_v1";
const MAX_WINDOW_HOURS = 12;

export type AttendanceErrorCode =
  | "not-configured"
  | "invalid-code"
  | "session-not-found"
  | "session-revoked"
  | "session-closed"
  | "not-started"
  | "ended"
  | "expired"
  | "not-eligible"
  | "event-full";

export class AttendanceError extends Error {
  readonly code: AttendanceErrorCode;
  readonly status: number;
  constructor(code: AttendanceErrorCode, message: string, status: number) {
    super(message);
    this.name = "AttendanceError";
    this.code = code;
    this.status = status;
  }
}

// ---------- Sessions ----------

export const attendanceSessionSchema = z.object({
  id: z.string().min(1).max(80),
  eventId: z.string().min(1).max(100),
  eventTitle: z.string().trim().min(2).max(160),
  clubId: z.string().max(100).default(""),
  clubName: z.string().trim().max(160).default(""),
  createdBy: z.string().max(80),
  status: z.enum(["active", "closed", "revoked"]),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  requireMembership: z.boolean(),
  maxCheckins: z.number().int().min(0).max(100000),
  createdAt: z.string().datetime(),
  closedAt: z.string().max(40).default(""),
});

export type AttendanceSession = z.infer<typeof attendanceSessionSchema>;

export const attendanceSessionInputSchema = z.object({
  eventId: z.string().trim().min(1).max(100),
  eventTitle: z.string().trim().min(2).max(160),
  clubId: z.string().trim().max(100).default(""),
  clubName: z.string().trim().max(160).default(""),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  requireMembership: z.boolean().default(false),
  maxCheckins: z.number().int().min(0).max(100000).default(0),
});

// ---------- Records ----------

export const attendanceRecordSchema = z.object({
  id: z.string().min(1).max(80),
  sessionId: z.string().min(1).max(80),
  eventId: z.string().min(1).max(100),
  clubId: z.string().max(100).default(""),
  userId: z.string().min(1).max(80),
  userName: z.string().max(120),
  status: z.enum(["present", "voided", "excused"]),
  method: z.enum(["qr", "manual"]),
  checkedInAt: z.string().datetime(),
  correctedBy: z.string().max(80).default(""),
  correctedAt: z.string().max(40).default(""),
  correctionReason: z.string().trim().max(300).default(""),
});

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

// ---------- QR secret ----------

interface SettingRow {
  key: string;
  value: string;
}

async function qrSecret(): Promise<string> {
  const fromEnv = process.env.CAMPUSONE_QR_SECRET?.trim();
  if (fromEnv) {
    if (fromEnv.length < 32)
      throw new AttendanceError("not-configured", "The QR signing secret is too short.", 503);
    return sha256(`campusone-qr-v1:${fromEnv}`);
  }
  if (process.env.NODE_ENV === "production")
    throw new AttendanceError(
      "not-configured",
      "Attendance is not configured on this server.",
      503,
    );
  const existing = store.find<SettingRow>("settings", (r) => r.key === SECRET_SETTING_KEY);
  if (existing?.value) return existing.value;
  const generated = sha256(`campusone-qr-dev:${newToken("qr")}`);
  await store.insert("settings", {
    key: SECRET_SETTING_KEY,
    value: generated,
    updatedBy: "system",
    updatedAt: new Date().toISOString(),
  });
  return generated;
}

// ---------- Codes ----------

export function qrSlot(at = new Date()): number {
  return Math.floor(at.getTime() / 1000 / QR_SLOT_SECONDS);
}

function signPayload(secret: string, sessionId: string, slot: number): string {
  return hmacSign(secret, `c1a1.${sessionId}.${slot}`);
}

/** Mint the currently-displayable QR payload for an active session. */
export async function mintSessionCode(
  sessionId: string,
  at = new Date(),
): Promise<{ code: string; sessionId: string; slot: number; slotEndsAt: string }> {
  const session = store.find<AttendanceSession>("attendance_sessions", (s) => s.id === sessionId);
  if (!session) throw new AttendanceError("session-not-found", "Attendance session not found.", 404);
  if (session.status === "revoked")
    throw new AttendanceError("session-revoked", "This attendance session was revoked.", 410);
  if (session.status === "closed")
    throw new AttendanceError("session-closed", "This attendance session is closed.", 410);
  const secret = await qrSecret();
  const slot = qrSlot(at);
  return {
    code: `${QR_VERSION}.${session.id}.${slot}.${signPayload(secret, session.id, slot)}`,
    sessionId: session.id,
    slot,
    slotEndsAt: new Date((slot + 1) * QR_SLOT_SECONDS * 1000).toISOString(),
  };
}

const CODE_PATTERN = /^C1A1\.([A-Za-z0-9_-]{1,80})\.(\d{1,12})\.([0-9a-f]{64})$/;

// ---------- Repository ----------

function nowIso(): string {
  return new Date().toISOString();
}

export const attendance = {
  getSession: (id: string) =>
    store.find<AttendanceSession>("attendance_sessions", (s) => s.id === id),

  listSessionsForEvent: (eventId: string) =>
    store
      .filter<AttendanceSession>("attendance_sessions", (s) => s.eventId === eventId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  createSession: async (
    input: unknown,
    by: string,
  ): Promise<AttendanceSession> => {
    const parsed = attendanceSessionInputSchema.parse(input);
    const starts = new Date(parsed.startsAt).getTime();
    const ends = new Date(parsed.endsAt).getTime();
    if (!Number.isFinite(starts) || !Number.isFinite(ends) || starts >= ends)
      throw new AttendanceError("invalid-code", "The check-in window is invalid.", 400);
    if (ends - starts > MAX_WINDOW_HOURS * 3_600_000)
      throw new AttendanceError(
        "invalid-code",
        `Check-in windows are limited to ${MAX_WINDOW_HOURS} hours.`,
        400,
      );
    if (ends <= Date.now())
      throw new AttendanceError("ended", "The check-in window has already ended.", 400);
    if (parsed.requireMembership && !parsed.clubId)
      throw new AttendanceError(
        "invalid-code",
        "Membership checks need a club on the session.",
        400,
      );
    const row = attendanceSessionSchema.parse({
      id: newId("att"),
      ...parsed,
      createdBy: by,
      status: "active",
      createdAt: nowIso(),
      closedAt: "",
    });
    await store.insert("attendance_sessions", row as unknown as Record<string, unknown>);
    return row;
  },

  setSessionStatus: async (
    id: string,
    status: "closed" | "revoked",
  ): Promise<AttendanceSession | null> => {
    const existing = store.find<AttendanceSession>("attendance_sessions", (s) => s.id === id);
    if (!existing || existing.status !== "active") return existing ?? null;
    const row = attendanceSessionSchema.parse({
      ...existing,
      status,
      closedAt: nowIso(),
    });
    await store.update<AttendanceSession>("attendance_sessions", (s) => s.id === id, row);
    return row;
  },

  checkIn: async (
    code: string,
    user: { id: string; name: string },
    at = new Date(),
  ): Promise<{
    record: AttendanceRecord;
    session: AttendanceSession;
    duplicate: boolean;
    badges: (BadgeAward & { badge: BadgeDefinition })[];
  }> => {
    const match = CODE_PATTERN.exec(code.trim());
    if (!match) throw new AttendanceError("invalid-code", "This QR code is not valid.", 400);
    const [, sessionId, slotRaw, signature] = match;
    const session = store.find<AttendanceSession>("attendance_sessions", (s) => s.id === sessionId);
    if (!session)
      throw new AttendanceError("session-not-found", "Attendance session not found.", 404);
    if (session.status === "revoked")
      throw new AttendanceError("session-revoked", "This attendance session was revoked.", 410);
    if (session.status === "closed")
      throw new AttendanceError("session-closed", "This attendance session is closed.", 410);
    if (at.getTime() < new Date(session.startsAt).getTime())
      throw new AttendanceError("not-started", "Check-in has not opened yet.", 409);
    if (at.getTime() > new Date(session.endsAt).getTime())
      throw new AttendanceError("ended", "Check-in for this session has ended.", 410);
    const slot = Number(slotRaw);
    const current = qrSlot(at);
    if (slot !== current && slot !== current - 1)
      throw new AttendanceError("expired", "This QR code has expired. Scan the live code.", 410);
    const secret = await qrSecret();
    if (!hmacVerify(secret, `c1a1.${session.id}.${slot}`, signature))
      throw new AttendanceError("invalid-code", "This QR code is not valid.", 400);
    const existing = store.find<AttendanceRecord>(
      "attendance_records",
      (r) => r.sessionId === session.id && r.userId === user.id && r.status !== "voided",
    );
    if (existing) return { record: existing, session, duplicate: true, badges: [] };
    if (session.requireMembership && session.clubId) {
      const member = campus
        .listMemberships(session.clubId)
        .some((m) => m.userId === user.id && m.status === "approved");
      if (!member)
        throw new AttendanceError(
          "not-eligible",
          "Only approved club members can check in to this session.",
          403,
        );
    }
    if (session.maxCheckins > 0) {
      const present = store.filter<AttendanceRecord>(
        "attendance_records",
        (r) => r.sessionId === session.id && r.status === "present",
      ).length;
      if (present >= session.maxCheckins)
        throw new AttendanceError("event-full", "This session has reached capacity.", 409);
    }
    const record = attendanceRecordSchema.parse({
      id: newId("atn"),
      sessionId: session.id,
      eventId: session.eventId,
      clubId: session.clubId,
      userId: user.id,
      userName: user.name.slice(0, 120),
      status: "present",
      method: "qr",
      checkedInAt: nowIso(),
      correctedBy: "",
      correctedAt: "",
      correctionReason: "",
    });
    await store.insert("attendance_records", record as unknown as Record<string, unknown>);
    const badges = await evaluateBadges(user.id, {
      eventId: session.eventId,
      clubId: session.clubId,
    });
    await notify(user.id, {
      kind: "attendance",
      title: "Checked in",
      body: `Your attendance at ${session.eventTitle} was recorded.`,
      link: "/participation",
    });
    return { record, session, duplicate: false, badges };
  },

  sessionCheckins: (sessionId: string) =>
    store
      .filter<AttendanceRecord>("attendance_records", (r) => r.sessionId === sessionId)
      .sort((a, b) => a.checkedInAt.localeCompare(b.checkedInAt)),

  myRecords: (userId: string) => {
    const sessions = new Map(
      store.all<AttendanceSession>("attendance_sessions").map((s) => [s.id, s]),
    );
    return store
      .filter<AttendanceRecord>("attendance_records", (r) => r.userId === userId)
      .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt))
      .map((record) => {
        const session = sessions.get(record.sessionId);
        return {
          ...record,
          eventTitle: session?.eventTitle ?? "Campus event",
          clubName: session?.clubName ?? "",
        };
      });
  },

  correctRecord: async (
    id: string,
    patch: { status: "present" | "voided" | "excused"; reason: string },
    by: string,
  ): Promise<AttendanceRecord | null> => {
    const existing = store.find<AttendanceRecord>("attendance_records", (r) => r.id === id);
    if (!existing) return null;
    const parsed = z
      .object({ status: z.enum(["present", "voided", "excused"]), reason: z.string().trim().min(3).max(300) })
      .parse(patch);
    const row = attendanceRecordSchema.parse({
      ...existing,
      status: parsed.status,
      correctedBy: by,
      correctedAt: nowIso(),
      correctionReason: parsed.reason,
    });
    await store.update<AttendanceRecord>("attendance_records", (r) => r.id === id, row);
    await notify(existing.userId, {
      kind: "attendance",
      title: "Attendance record updated",
      body: `An executive updated your attendance record: ${parsed.reason}`,
      link: "/participation",
    });
    return row;
  },
};
