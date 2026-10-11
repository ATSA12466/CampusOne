import assert from "node:assert/strict";
import { visit, capture, eventCards } from "./helpers.mjs";
export async function checkApiCatalog(page, base, output, key, fixture) {
  const captures = [];
  fixture.state.catalogMode = "error";
  await visit(page, base, "/events");
  await page.getByText("The events need another moment.", { exact: true }).waitFor();
  assert.equal(await eventCards(page).count(), 0);
  captures.push(await capture(page, output, `${key}-catalog-error`));
  fixture.state.catalogMode = "ok";
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByRole("heading", { name: "Innovation Night", exact: true }).waitFor();
  await page
    .getByText("Search, filters and sorting apply to the 30 loaded events of 35.", { exact: true })
    .waitFor();
  assert.equal(await eventCards(page).count(), 6);
  fixture.state.catalogMode = "error";
  await page.getByRole("button", { name: "Load more events", exact: true }).click();
  await page
    .getByText("CampusOne couldn't complete this request. Please retry.", { exact: true })
    .waitFor();
  assert.equal(await eventCards(page).count(), 6);
  captures.push(await capture(page, output, `${key}-load-more-error`));
  fixture.state.catalogMode = "ok";
  fixture.state.catalogDelay = 700;
  await page.getByRole("button", { name: "Load more events", exact: true }).click();
  await page.getByRole("button", { name: "Loading more events…", exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Loading more events…", exact: true })
    .waitFor({ state: "hidden" });
  fixture.state.catalogDelay = 0;
  assert.equal(
    await page
      .getByText("Search, filters and sorting apply to the 30 loaded events of 35.", {
        exact: true,
      })
      .count(),
    0,
  );
  captures.push(await capture(page, output, `${key}-catalog-retry-more`));
  return captures;
}
