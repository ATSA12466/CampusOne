import { NextResponse } from "next/server";
import { apiEndpoints } from "@/config/api-endpoints";
import {
  academicsService,
  communityService,
  engagementService,
  homeService,
  lifeService,
  mediaService,
  productivityService,
} from "@/services/demo";
import type { CollectionMap, CollectionName } from "@/types/service-contracts";
import { limited } from "@/server/guards";
import { collectionOverlays, withLiveAttendance } from "@/server/overlays";

const readers: { [K in CollectionName]: () => CollectionMap[K][] } = {
  featured: homeService.listFeaturedContent,
  clubs: engagementService.listClubs,
  events: engagementService.listEvents,
  opportunities: engagementService.listOpportunities,
  accommodation: lifeService.listAccommodation,
  marketplace: lifeService.listMarketplace,
  lostFound: lifeService.listLostFound,
  resources: academicsService.listResources,
  courses: academicsService.listCourses,
  posts: communityService.listPosts,
  conversations: communityService.listConversations,
  notifications: communityService.listNotifications,
  media: mediaService.listMedia,
  announcements: engagementService.listAnnouncements,
  timetable: productivityService.listTimetableSessions,
  representatives: engagementService.listRepresentatives,
  projects: engagementService.listSrcProjects,
  campaigns: engagementService.listCampaigns,
};

function property(item: object, keys: readonly string[]): string {
  for (const key of keys) {
    const value: unknown = Object.entries(item).find(([name]) => name === key)?.[1];
    if (typeof value === "string") return value;
  }
  return "";
}

interface ListParams {
  search: string;
  category: string;
  sort: "title" | "newest";
  page: number;
  pageSize: number;
}

function parseListParams(url: string): ListParams | null {
  const params = new URL(url).searchParams;
  const search = (params.get("search") ?? "").slice(0, 160);
  const category = (params.get("category") ?? "all").slice(0, 80);
  const sort = params.get("sort") ?? "title";
  if (sort !== "title" && sort !== "newest") return null;
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "18");
  if (!Number.isInteger(page) || page < 1) return null;
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 30) return null;
  return { search, category, sort, page, pageSize };
}

/** Mirrors demoCatalog query semantics over merged fixtures + overlays. */
function queryCollection<K extends CollectionName>(
  collection: K,
  filter: ListParams,
): { items: CollectionMap[K][]; total: number; dropped: number } {
  const { items: overlays, dropped } = collectionOverlays(collection);
  let merged: CollectionMap[K][] = [
    ...readers[collection](),
    ...(overlays as unknown as CollectionMap[K][]),
  ];
  if (collection === "events")
    merged = (merged as unknown as { id: string; seats: number; registered: number }[]).map((e) =>
      withLiveAttendance(e),
    ) as unknown as CollectionMap[K][];
  const needle = filter.search.toLocaleLowerCase("en-GH");
  const items = merged
    .filter((item) => {
      const text = Object.values(item as object)
        .filter((value): value is string => typeof value === "string")
        .join(" ")
        .toLocaleLowerCase("en-GH");
      return (
        text.includes(needle) &&
        (filter.category === "all" || property(item as object, ["category", "kind", "type"]) === filter.category)
      );
    })
    .sort((a, b) =>
      filter.sort === "newest"
        ? property(b as object, ["createdAt", "publishedAt", "uploadedAt", "date", "startDate"]).localeCompare(
            property(a as object, ["createdAt", "publishedAt", "uploadedAt", "date", "startDate"]),
          )
        : property(a as object, ["title", "name", "item", "course", "author"]).localeCompare(
            property(b as object, ["title", "name", "item", "course", "author"]),
            "en-GH",
          ),
    );
  const offset = (filter.page - 1) * filter.pageSize;
  return {
    items: structuredClone(items.slice(offset, offset + filter.pageSize)),
    total: items.length,
    dropped,
  };
}

function resolveCollection(pathname: string): { collection: CollectionName; id: string | null } | null {
  for (const [collection, base] of Object.entries(apiEndpoints) as [CollectionName, string][]) {
    if (pathname === base) return { collection, id: null };
    if (pathname.startsWith(`${base}/`)) {
      const id = pathname.slice(base.length + 1);
      if (id && !id.includes("/")) {
        try {
          return { collection, id: decodeURIComponent(id) };
        } catch {
          return null;
        }
      }
      return null;
    }
  }
  return null;
}

export async function GET(request: Request, { params }: { params: Promise<{ rest: string[] }> }) {
  const hit = limited(request, "catalog", 300);
  if (hit) return hit;
  const { rest } = await params;
  const resolved = resolveCollection(`/${rest.join("/")}`);
  if (!resolved) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (resolved.id === null) {
    const filter = parseListParams(request.url);
    if (!filter) return NextResponse.json({ error: "Invalid list query." }, { status: 400 });
    const { items, total, dropped } = queryCollection(resolved.collection, filter);
    return NextResponse.json(
      { items, total, page: filter.page, pageSize: filter.pageSize },
      dropped ? { headers: { "X-Overlay-Dropped": String(dropped) } } : undefined,
    );
  }
  const fixture = readers[resolved.collection]().find((item) => item.id === resolved.id) ?? null;
  if (fixture) {
    const item =
      resolved.collection === "events"
        ? withLiveAttendance(fixture as unknown as { id: string; seats: number; registered: number })
        : fixture;
    return NextResponse.json(structuredClone(item));
  }
  const { items } = collectionOverlays(resolved.collection);
  const overlay = items.find((item) => (item as { id?: string }).id === resolved.id) ?? null;
  if (overlay) return NextResponse.json(overlay);
  return NextResponse.json({ error: "Not found." }, { status: 404 });
}
