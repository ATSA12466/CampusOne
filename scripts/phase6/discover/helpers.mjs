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
export const loadedCounts = [16, 16, 3, 2, 2, 2, 2, 2];
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
