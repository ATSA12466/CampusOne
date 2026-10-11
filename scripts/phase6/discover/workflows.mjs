import assert from "node:assert/strict";
import {
  authContext,
  visit,
  capture,
  cards,
  stored,
  trackErrors,
  categories,
  chooseCategory,
} from "./helpers.mjs";
export async function workflowChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-workflow`;
      try {
        await visit(page, base, "/discover?view=all");
        const saved = [];
        for (const category of categories) {
          await chooseCategory(page, category);
          await cards(page).first().waitFor();
          const card = cards(page).first(),
            title = await card.locator("h3").textContent();
          await card
            .getByRole("button", { name: `Save ${title}`, exact: true })
            .click();
          await card
            .getByRole("button", { name: `Unsave ${title}`, exact: true })
            .waitFor();
          saved.push(await card.getAttribute("data-discover-key"));
        }
        assert.equal((await stored(page, "campusone-app")).bookmarks.length, 8);
        await page
          .getByRole("combobox", {
            name: "Filter discovery category",
            exact: true,
          })
          .selectOption("all");
        await page.getByRole("radio", { name: "Saved", exact: true }).click();
        await page
          .getByText("8 finds · page 1 of 2", { exact: true })
          .waitFor();
        captures.push(await capture(page, output, `${key}-saved-eight`));
        await page.reload({ waitUntil: "networkidle" });
        await page
          .getByText("8 finds · page 1 of 2", { exact: true })
          .waitFor();
        assert.equal((await stored(page, "campusone-app")).bookmarks.length, 8);
        await page
          .getByRole("button", { name: "Next page", exact: true })
          .click();
        assert.equal(await cards(page).count(), 2);
        await visit(page, base, "/events/e1");
        await page
          .getByRole("button", { name: "Unsave Innovation Night", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Save Innovation Night", exact: true })
          .waitFor();
        await visit(page, base, "/clubs/club-1");
        await page
          .getByRole("button", { name: "Unsave Code Collective", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Save Code Collective", exact: true })
          .waitFor();
        await visit(page, base, "/discover?view=saved");
        await page
          .getByText("6 finds · page 1 of 1", { exact: true })
          .waitFor();
        assert.equal((await stored(page, "campusone-app")).bookmarks.length, 6);
        const card = cards(page).first(),
          title = await card.locator("h3").textContent();
        await card
          .getByRole("button", { name: `Unsave ${title}`, exact: true })
          .click();
        await page
          .getByText("5 finds · page 1 of 1", { exact: true })
          .waitFor();
        captures.push(await capture(page, output, `${key}-shared-removal`));
        assert.equal(
          (await stored(page, "campusone-app")).memberships.length,
          2,
        );
        assert.deepEqual(
          (await stored(page, "campusone-app")).registrations,
          [],
        );
        assert.deepEqual(errors, []);
        console.log(
          "Discover eight-type saves/reload/shared Clubs-Events removal",
          width,
          theme,
          "passed",
        );
      } finally {
        await context.close();
      }
    }
  return {
    captures,
    allEightTypes: true,
    persistence: true,
    sharedClubEventBookmarks: true,
    legacyExecutiveSeeds: true,
  };
}
