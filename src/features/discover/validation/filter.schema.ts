import { z } from "zod";
import { discoverCategories, discoverDefaults } from "@/config/discover";
import type { DiscoverFilter } from "@/types/discover";
export const discoverFilterSchema = z.object({
  query: z.string().max(120).default(""),
  category: z.enum(["all", ...discoverCategories]).default("all"),
  view: z.enum(["edit", "all", "saved"]).default("edit"),
  sort: z.enum(["mix", "name", "date"]).default("mix"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});
export function readDiscoverFilter(
  input: Record<string, unknown>,
): DiscoverFilter {
  const result = discoverFilterSchema.safeParse(input);
  return result.success ? result.data : { ...discoverDefaults };
}
export function filterFromParams(params: URLSearchParams) {
  return readDiscoverFilter({
    query: params.get("q") ?? "",
    category: params.get("category") ?? "all",
    view: params.get("view") ?? "edit",
    sort: params.get("sort") ?? "mix",
    page: params.get("page") ?? 1,
  });
}
export function filterParams(filter: DiscoverFilter) {
  const params = new URLSearchParams();
  if (filter.query) params.set("q", filter.query);
  if (filter.category !== "all") params.set("category", filter.category);
  if (filter.view !== "edit") params.set("view", filter.view);
  if (filter.sort !== "mix") params.set("sort", filter.sort);
  if (filter.page > 1) params.set("page", String(filter.page));
  return params;
}
