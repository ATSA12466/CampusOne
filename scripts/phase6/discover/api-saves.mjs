import assert from "node:assert/strict";
import { visit, capture, stored } from "./helpers.mjs";
export async function checkApiSaves(page, base, output, key, fixture) {
  const captures = [];
  fixture.state.activityMode = "error";
  await visit(
    page,
    base,
    "/discover?category=events&view=all&q=Innovation%20Night",
  );
  await page.getByText(/Your saved campus items could not load/).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Save Innovation Night", exact: true })
      .isDisabled(),
    true,
  );
  await page.getByRole("radio", { name: "Saved", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "Your saved finds need another moment.",
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page
      .getByText("A little collection, waiting to happen.", { exact: true })
      .count(),
    0,
  );
  captures.push(await capture(page, output, `${key}-activity-error-not-empty`));
  fixture.state.activityMode = "ok";
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page
    .getByText("A little collection, waiting to happen.", { exact: true })
    .waitFor();
  await page.getByRole("radio", { name: "Browse all", exact: true }).click();
  fixture.state.mutationMode = "error";
  await page
    .getByRole("button", { name: "Save Innovation Night", exact: true })
    .click();
  await page
    .getByText("CampusOne couldn't complete this request. Please retry.", {
      exact: false,
    })
    .first()
    .waitFor();
  assert.deepEqual(fixture.state.saved, []);
  assert.equal(
    await page
      .getByRole("button", { name: "Save Innovation Night", exact: true })
      .getAttribute("aria-pressed"),
    "false",
  );
  assert.equal(
    await page
      .getByRole("searchbox", { name: "Search across campus", exact: true })
      .inputValue(),
    "Innovation Night",
  );
  captures.push(await capture(page, output, `${key}-save-error-rollback`));
  fixture.state.mutationMode = "ok";
  fixture.state.holdMutations = true;
  try {
    const before = fixture.hits.filter(
      (h) => h.method === "PUT" && h.path === "/api/discover/events/e1/saved",
    ).length;
    await page
      .getByRole("button", { name: "Save Innovation Night", exact: true })
      .evaluate((button) => {
        button.click();
        button.click();
      });
    await page
      .getByRole("button", { name: "Saving Innovation Night", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Saving Innovation Night", exact: true })
        .isDisabled(),
      true,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Saving Innovation Night", exact: true })
        .getAttribute("aria-pressed"),
      "true",
    );
    captures.push(await capture(page, output, `${key}-pending-single-flight`));
    assert.equal(
      fixture.hits.filter(
        (h) => h.method === "PUT" && h.path === "/api/discover/events/e1/saved",
      ).length,
      before + 1,
    );
    fixture.releaseWrites();
    fixture.state.holdMutations = false;
    await page
      .getByRole("button", { name: "Unsave Innovation Night", exact: true })
      .waitFor();
  } finally {
    fixture.state.holdMutations = false;
    fixture.releaseWrites();
  }
  assert.deepEqual((await stored(page, "campusone-app"))?.bookmarks ?? [], []);
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Unsave Innovation Night", exact: true })
    .waitFor();
  captures.push(await capture(page, output, `${key}-publisher-save-reload`));
  await visit(page, base, "/events/e1");
  await page
    .getByRole("button", { name: "Unsave Innovation Night", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save Innovation Night", exact: true })
    .waitFor();
  assert.deepEqual(fixture.state.saved, []);
  await visit(
    page,
    base,
    "/discover?category=clubs&view=all&q=Code%20Collective",
  );
  await page
    .getByRole("button", { name: "Save Code Collective", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Unsave Code Collective", exact: true })
    .waitFor();
  await visit(page, base, "/clubs/club-1");
  await page
    .getByRole("button", { name: "Unsave Code Collective", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save Code Collective", exact: true })
    .waitFor();
  assert.deepEqual(fixture.state.saved, []);
  assert.deepEqual((await stored(page, "campusone-app"))?.bookmarks ?? [], []);
  await visit(page, base, "/discover?category=accommodation&view=all");
  await page
    .getByRole("button", { name: "Save BlueNest Residence", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Unsave BlueNest Residence", exact: true })
    .waitFor();
  captures.push(await capture(page, output, `${key}-living-publisher-save`));
  await page
    .getByRole("button", { name: "Unsave BlueNest Residence", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Save BlueNest Residence", exact: true })
    .waitFor();
  assert.deepEqual(fixture.state.saved, []);
  return captures;
}
