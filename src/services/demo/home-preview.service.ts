import type { HomeFeedService, HomePreviewMode, HomeCollection } from "@/types/home";
// Imported only in development; not a production fallback or backend simulator.
const sourceNames: HomeCollection[] = [
  "featured",
  "clubs",
  "events",
  "opportunities",
  "campaigns",
  "timetable",
  "courses",
];
const recovered = new Set<string>();
export function createHomePreviewService(
  service: HomeFeedService,
  mode: HomePreviewMode,
  runId = "default",
): HomeFeedService {
  return {
    async snapshot(options) {
      const feed = await service.snapshot(options);
      if (mode === "recover" && recovered.has(runId)) return feed;
      if (mode === "recover") {
        if (recovered.size >= 32) recovered.delete(recovered.values().next().value!);
        recovered.add(runId);
      }
      if (mode === "inactive")
        return { ...feed, featured: feed.featured.map((item) => ({ ...item, active: false })) };
      if (mode === "truncated") return { ...feed, truncated: ["clubs", "timetable"] };
      if (mode === "partial" || mode === "recover")
        return { ...feed, featured: [], timetable: [], unavailable: ["featured", "timetable"] };
      return {
        ...feed,
        featured: [],
        clubs: [],
        events: [],
        opportunities: [],
        campaigns: [],
        timetable: [],
        courses: [],
        truncated: [],
        unavailable: mode === "offline" ? sourceNames : [],
      };
    },
  };
}
