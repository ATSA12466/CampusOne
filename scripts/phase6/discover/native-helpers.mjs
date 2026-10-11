import { discoverCatalogService } from "../../../src/services/discover/discover.service.ts";
import { discoverDefaults } from "../../../src/config/discover.ts";
export const snapshot = await discoverCatalogService.snapshot();
export const sections = snapshot.sections;
export const items = sections.flatMap((section) => section.page?.items ?? []);
export const filter = { ...discoverDefaults };
export const now = new Date("2026-10-11T12:00:00Z");
export const find = (category, id) =>
  items.find((item) => item.category === category && item.id === id);
export async function withFetch(mock, run) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}
