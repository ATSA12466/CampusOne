import assert from "node:assert/strict";
import { visit, capture, cards } from "./helpers.mjs";
export async function checkApiStates(page, base, output, key, fixture) {
  const captures = [];
  await visit(page, base, "/discover?category=events&view=all");
  await page
    .getByRole("button", { name: "Load more Events", exact: true })
    .click();
  await page.getByText(/^35 loaded listings of 35 reported/).waitFor();
  await page
    .getByRole("searchbox", { name: "Search across campus", exact: true })
    .fill("Mock API event 35");
  await page
    .getByRole("heading", { name: "Mock API event 35", exact: true })
    .waitFor();
  await page.getByText("Price not supplied", { exact: true }).waitFor();
  await page
    .getByText("Category illustration · not this listing", { exact: true })
    .first()
    .waitFor();
  assert.equal(await cards(page).count(), 1);
  captures.push(await capture(page, output, `${key}-legacy-no-invented-fee`));
  for (const collection of Object.keys(fixture.rows))
    fixture.state.modes[collection] = "empty";
  await visit(page, base, "/discover?view=all");
  await page
    .getByText("Nothing here matches just yet.", { exact: true })
    .waitFor();
  assert.equal(await cards(page).count(), 0);
  captures.push(await capture(page, output, `${key}-genuine-empty-catalog`));
  for (const collection of Object.keys(fixture.rows))
    fixture.state.modes[collection] = "error";
  await visit(page, base, "/discover");
  await page
    .getByRole("heading", {
      name: "This corner of campus needs another moment.",
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page
      .getByText("Nothing here matches just yet.", { exact: true })
      .count(),
    0,
  );
  captures.push(await capture(page, output, `${key}-complete-error-not-empty`));
  fixture.state.modes = {};
  await page
    .getByRole("button", { name: "Retry Study resources", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Agile sprint planning notes", exact: true })
    .waitFor();
  assert.ok((await cards(page).count()) > 0);
  return captures;
}
