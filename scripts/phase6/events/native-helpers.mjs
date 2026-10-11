import { eventCatalogService } from "../../../src/services/events/catalog.service.ts";
export const events = (await eventCatalogService.list()).page.items;
export const find = (id) => events.find((event) => event.id === id);
export const now = new Date("2026-10-11T12:00:00Z");
export const activity = { goingIds: [], savedIds: [], attendance: [] };
export const filter = {
  query: "",
  category: "all",
  time: "all",
  sort: "soon",
  view: "all",
  page: 1,
  freeOnly: false,
};
export async function withFetch(mock, run) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}
