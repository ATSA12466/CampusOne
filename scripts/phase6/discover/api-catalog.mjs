import assert from "node:assert/strict";
import { visit, capture, cards, cardKeys, chooseCategory } from "./helpers.mjs";
export async function checkApiCatalog(page, base, output, key, fixture) {
  const captures = [];
  fixture.state.modes.events = "error";
  await visit(page, base, "/discover?view=all");
  await page
    .getByRole("button", { name: "Retry Events", exact: true })
    .waitFor();
  assert.ok((await cards(page).count()) > 0);
  assert.equal(
    await page
      .getByRole("heading", { name: "Innovation Night", exact: true })
      .count(),
    0,
  );
  captures.push(await capture(page, output, `${key}-partial-catalog`));
  const initialReads = fixture.hits.filter(
    (h) =>
      /^\/api\/(clubs|events|resources|opportunities|accommodation|marketplace|media|lost-found)$/.test(
        h.path,
      ) && !h.fetchSite,
  );
  assert.equal(initialReads.length, 8);
  assert.ok(
    initialReads.every(
      (h) => h.cookie === "campus_session=fixture-session-only",
    ),
  );
  fixture.state.modes.events = "ok";
  await page.getByRole("button", { name: "Retry Events", exact: true }).click();
  await page
    .getByRole("heading", { name: "Innovation Night", exact: true })
    .waitFor();
  await chooseCategory(page, "events");
  await page.getByText(/^30 loaded listings of 35 reported/).waitFor();
  const before = await cardKeys(page);
  captures.push(await capture(page, output, `${key}-bounded-30-of-35`));
  fixture.state.pageTwoError = true;
  await page
    .getByRole("button", { name: "Load more Events", exact: true })
    .click();
  await page.getByText(/Your earlier listings are unchanged/).waitFor();
  assert.deepEqual(await cardKeys(page), before);
  await page.getByText(/^30 loaded listings of 35 reported/).waitFor();
  captures.push(await capture(page, output, `${key}-load-more-error`));
  fixture.state.pageTwoError = false;
  await page
    .getByRole("button", { name: "Retry loading Events", exact: true })
    .click();
  await page.getByText(/^35 loaded listings of 35 reported/).waitFor();
  await page.getByRole("button", { name: "Page 6", exact: true }).click();
  assert.equal(await cards(page).count(), 5);
  captures.push(await capture(page, output, `${key}-all-upstream-pages`));
  return captures;
}
