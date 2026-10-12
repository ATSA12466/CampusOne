// Server overlays: approved/published FileStore records merged into catalog
// responses. Every overlay is validated against the client entity contract;
// invalid records are dropped (counted) rather than served or fabricated.
import { entitySchemas } from "../services/validation/catalog.schemas";
import type { CollectionName } from "../types/service-contracts";
import { adminRegistry } from "./admin";
import { campus } from "./campus";
import { registry, type ClubRegistration } from "./registry";

function clubCover(): string {
  return "/images/demo/clubs-hero.webp";
}

export function registryClubToClub(reg: ClubRegistration): Record<string, unknown> | null {
  const officers = campus
    .listOfficers(reg.id)
    .filter((o) => o.status === "active")
    .slice(0, 12)
    .map((o) => ({ name: o.name, role: o.position + (o.committee ? ` · ${o.committee}` : "") }));
  const members = campus
    .listMemberships(reg.id)
    .filter((m) => m.status === "approved").length;
  const candidate = {
    id: reg.id,
    name: reg.name,
    category: reg.category,
    description: reg.description,
    cover: clubCover(),
    objectives: reg.objectives.slice(0, 12),
    details: {
      tagline: reg.category,
      coverAlt: `${reg.name} community photograph`,
      memberCount: members,
      meeting: "To be announced",
      venue: "To be announced",
      fee: 0,
      founded: Number(reg.createdAt.slice(0, 4)) || new Date().getFullYear(),
      accepting: true,
      rank: 0,
      story: [reg.description],
      highlights: reg.objectives.slice(0, 12),
      leaders: officers,
      gallery: [],
    },
  };
  const parsed = entitySchemas.clubs.safeParse(candidate);
  return parsed.success ? (parsed.data as unknown as Record<string, unknown>) : null;
}

function announcementCategory(audience: string): "src" | "campus" | "club" {
  if (audience === "src") return "src";
  if (audience === "clubs") return "club";
  return "campus";
}

/** Validated overlay items for a collection (fixtures stay the base). */
export function collectionOverlays(collection: CollectionName): {
  items: Record<string, unknown>[];
  dropped: number;
} {
  const items: Record<string, unknown>[] = [];
  let dropped = 0;
  const push = (candidate: Record<string, unknown>) => {
    const parsed = (entitySchemas[collection] as unknown as { safeParse: (v: unknown) => { success: boolean; data?: unknown } }).safeParse(candidate);
    if (parsed.success) items.push(parsed.data as Record<string, unknown>);
    else dropped += 1;
  };
  if (collection === "clubs") {
    for (const reg of registry.listClubs("approved")) {
      const mapped = registryClubToClub(reg);
      if (mapped) items.push(mapped);
      else dropped += 1;
    }
  } else if (collection === "events") {
    for (const row of campus.listCampusEvents("published")) {
      const going = campus.eventRsvpCount(row.id);
      push({
        ...row.event,
        registered: Math.min(row.event.seats, row.event.registered + going),
      } as unknown as Record<string, unknown>);
    }
  } else if (collection === "announcements") {
    for (const ann of registry.publishedAnnouncements()) {
      push({
        id: ann.id,
        title: ann.title,
        content: ann.body,
        category: announcementCategory(ann.audience),
        pinned: false,
        publishedAt: (ann.publishAt ?? ann.updatedAt).slice(0, 10),
      });
    }
  } else if (collection === "accommodation") {
    for (const listing of adminRegistry.approvedListings()) {
      push({
        id: listing.id,
        title: listing.title,
        location: listing.area,
        price: `GH₵${listing.price.toLocaleString("en-GH")} / ${listing.period}`,
        facilities: [
          `${listing.beds} bed${listing.beds === 1 ? "" : "s"}`,
          listing.area,
          "Verified listing",
        ],
      });
    }
  } else if (collection === "resources") {
    const kindMap: Record<string, string> = {
      note: "pdf",
      "past-question": "pdf",
      slide: "slides",
      reading: "link",
      video: "video",
      other: "link",
    };
    for (const material of adminRegistry.listMaterials("published")) {
      push({
        id: material.id,
        title: material.title,
        course: material.course,
        category: kindMap[material.kind] ?? "link",
        description: material.description || material.title,
        uploadedAt: material.updatedAt,
        downloadable: true,
        ...(material.fileUrl ? { url: material.fileUrl } : {}),
      });
    }
  }
  return { items, dropped };
}

/** Bump a fixture event's registered count with real server RSVPs (capped). */
export function withLiveAttendance<T extends { id: string; seats: number; registered: number }>(
  event: T,
): T {
  const going = campus.eventRsvpCount(event.id);
  if (!going) return event;
  return { ...event, registered: Math.min(event.seats, event.registered + going) };
}
