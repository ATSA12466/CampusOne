// Route-side catalog lookups: fixture + server-overlay clubs/events by id.
import { engagementService } from "@/services/demo";
import { campus } from "@/server/campus";
import { registry } from "@/server/registry";

export interface ClubRef {
  id: string;
  name: string;
}

export interface EventRef {
  id: string;
  title: string;
  seats: number;
  baseRegistered: number;
  clubId: string;
}

export function findClub(id: string): ClubRef | null {
  if (!id) return null;
  const fixture = engagementService.listClubs().find((club) => club.id === id);
  if (fixture) return { id: fixture.id, name: fixture.name };
  const reg = registry.listClubs("approved").find((club) => club.id === id);
  if (reg) return { id: reg.id, name: reg.name };
  return null;
}

export function findEvent(id: string): EventRef | null {
  if (!id) return null;
  const fixture = engagementService.listEvents().find((event) => event.id === id);
  if (fixture)
    return {
      id: fixture.id,
      title: fixture.title,
      seats: fixture.seats,
      baseRegistered: fixture.registered,
      clubId: "",
    };
  const row = campus.getCampusEvent(id);
  if (row && row.meta.visibility === "published")
    return {
      id: row.id,
      title: row.event.title,
      seats: row.event.seats,
      baseRegistered: row.event.registered,
      clubId: row.meta.clubId,
    };
  return null;
}
