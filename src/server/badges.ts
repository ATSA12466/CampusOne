// Node-safe participation badges. Definitions are rule-based and evaluated
// server-side on every check-in; awards are stored, never recomputed fiction.
import { z } from "zod";
import { newId } from "./crypto";
import { store } from "./store";
import { notify } from "./notify";

export const badgeRuleKinds = ["checkins_total", "checkins_club", "events_distinct"] as const;

export const badgeDefinitionSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(4).max(300),
  icon: z.string().trim().min(1).max(60),
  rule: z.enum(badgeRuleKinds),
  threshold: z.number().int().min(1).max(1000),
});

export type BadgeDefinition = z.infer<typeof badgeDefinitionSchema>;

export const badgeAwardSchema = z.object({
  id: z.string().min(1).max(80),
  userId: z.string().min(1).max(80),
  badgeId: z.string().min(1).max(80),
  eventId: z.string().max(100).default(""),
  clubId: z.string().max(100).default(""),
  awardedAt: z.string().datetime(),
});

export type BadgeAward = z.infer<typeof badgeAwardSchema>;

const DEFAULT_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "badge-first-steps",
    name: "First Steps",
    description: "Checked in to a first campus event.",
    icon: "verified",
    rule: "checkins_total",
    threshold: 1,
  },
  {
    id: "badge-club-regular",
    name: "Club Regular",
    description: "Checked in 3 times with a single club.",
    icon: "groups",
    rule: "checkins_club",
    threshold: 3,
  },
  {
    id: "badge-explorer",
    name: "Explorer",
    description: "Checked in at 5 different events.",
    icon: "explore",
    rule: "events_distinct",
    threshold: 5,
  },
];

/** Idempotent seed so awards work on databases created before badges existed. */
export async function ensureBadgeDefinitions(): Promise<BadgeDefinition[]> {
  for (const def of DEFAULT_DEFINITIONS) {
    const existing = store.find<BadgeDefinition>("badge_definitions", (d) => d.id === def.id);
    if (!existing) await store.insert("badge_definitions", { ...def });
  }
  return listBadgeDefinitions();
}

export function listBadgeDefinitions(): BadgeDefinition[] {
  return store.all<BadgeDefinition>("badge_definitions");
}

export function myBadges(userId: string): (BadgeAward & { badge: BadgeDefinition | null })[] {
  const defs = new Map(listBadgeDefinitions().map((d) => [d.id, d]));
  return store
    .filter<BadgeAward>("badges_awarded", (a) => a.userId === userId)
    .sort((a, b) => b.awardedAt.localeCompare(a.awardedAt))
    .map((award) => ({ ...award, badge: defs.get(award.badgeId) ?? null }));
}

interface AttendanceLike {
  userId: string;
  eventId: string;
  clubId: string;
  status: string;
}

/**
 * Evaluate badge rules for a user after a check-in. Returns newly created
 * awards (each badge is awarded at most once per user).
 */
export async function evaluateBadges(
  userId: string,
  context: { eventId: string; clubId: string },
): Promise<(BadgeAward & { badge: BadgeDefinition })[]> {
  await ensureBadgeDefinitions();
  const present = store.filter<AttendanceLike>(
    "attendance_records",
    (r) => r.userId === userId && r.status === "present",
  );
  const total = present.length;
  const byClub = new Map<string, number>();
  const events = new Set<string>();
  for (const record of present) {
    if (record.clubId) byClub.set(record.clubId, (byClub.get(record.clubId) ?? 0) + 1);
    if (record.eventId) events.add(record.eventId);
  }
  const held = new Set(
    store.filter<BadgeAward>("badges_awarded", (a) => a.userId === userId).map((a) => a.badgeId),
  );
  const awarded: (BadgeAward & { badge: BadgeDefinition })[] = [];
  for (const def of listBadgeDefinitions()) {
    if (held.has(def.id)) continue;
    const progress =
      def.rule === "checkins_total"
        ? total
        : def.rule === "checkins_club"
          ? Math.max(0, ...byClub.values())
          : events.size;
    if (progress < def.threshold) continue;
    const award = badgeAwardSchema.parse({
      id: newId("bdg"),
      userId,
      badgeId: def.id,
      eventId: context.eventId,
      clubId: context.clubId,
      awardedAt: new Date().toISOString(),
    });
    await store.insert("badges_awarded", award as unknown as Record<string, unknown>);
    awarded.push({ ...award, badge: def });
    await notify(userId, {
      kind: "badge",
      title: `Badge earned: ${def.name}`,
      body: def.description,
      link: "/participation",
    });
  }
  return awarded;
}
