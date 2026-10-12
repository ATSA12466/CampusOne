import "../../foundation/load-typescript.mjs";
export {
  authContext,
  visit,
  capture,
  stored,
  focusIs,
  trackErrors,
} from "../events/helpers.mjs";
export const cards = (page) => page.locator("article[data-discover-key]");
export const cardKeys = (page) =>
  cards(page).evaluateAll((nodes) =>
    nodes.map((node) => node.dataset.discoverKey),
  );
export const categories = [
  "clubs",
  "events",
  "resources",
  "opportunities",
  "accommodation",
  "marketplace",
  "media",
  "lost-found",
];
const { demoCatalog } = await import(
  "../../../src/services/demo/catalog.service.ts"
);
export const loadedCounts = await Promise.all(
  categories.map(async (category) => {
    const result = await demoCatalog.list(
      category === "lost-found" ? "lostFound" : category,
      { pageSize: 30 },
    );
    if (result.hasMore)
      throw new Error(
        "Update Discover fixtures to explicitly audit loaded pages, not assume a complete source",
      );
    return result.items.length;
  }),
);
export const resourceCourseIds = (
  await demoCatalog.list("resources", { pageSize: 30 })
).items
  .filter((item) => item.course === "ITT 315")
  .map((item) => `resources:${item.id}`);
export const allUnique = loadedCounts.reduce((sum, count) => sum + count, 0),
  allPages = Math.ceil(allUnique / 6);
export async function chooseCategory(page, category) {
  await page
    .getByRole("combobox", { name: "Filter discovery category", exact: true })
    .selectOption(category);
  await page.waitForFunction(
    (category) =>
      Array.from(document.querySelectorAll("article[data-discover-key]")).every(
        (node) => node.dataset.discoverKey.startsWith(`${category}:`),
      ),
    category,
  );
}
