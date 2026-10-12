import assert from "node:assert/strict";
import {
  authContext,
  visit,
  capture,
  cards,
  cardKeys,
  focusIs,
  trackErrors,
  categories,
  loadedCounts,
  allUnique,
  allPages,
  resourceCourseIds,
  chooseCategory,
} from "./helpers.mjs";
export async function directoryChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-directory`;
      try {
        await visit(page, base, "/discover");
        await page
          .getByText("24 finds · page 1 of 4", { exact: true })
          .waitFor();
        assert.equal(await page.locator("h1").count(), 1);
        assert.equal(await cards(page).count(), 6);
        assert.match(await page.title(), /Discover.*CampusOne/);
        const geometry = await page
          .locator(".discover-hero")
          .evaluate((el) => ({
            frame: el.getBoundingClientRect().toJSON(),
            photo: el.querySelector("img").getBoundingClientRect().toJSON(),
            copy: el
              .querySelector(".discover-hero-content")
              .getBoundingClientRect()
              .toJSON(),
          }));
        for (const edge of ["left", "right", "top", "bottom"])
          assert.ok(Math.abs(geometry.frame[edge] - geometry.photo[edge]) < 2);
        assert.ok(geometry.copy.bottom <= geometry.frame.bottom + 1);
        captures.push(await capture(page, output, `${key}-edit`));
        const editSeen = new Set(await cardKeys(page));
        for (const n of [2, 3, 4]) {
          await page
            .getByRole("button", { name: "Next page", exact: true })
            .click();
          await focusIs(page, page.locator("#discover-results-title"));
          for (const id of await cardKeys(page)) {
            assert.ok(!editSeen.has(id));
            editSeen.add(id);
          }
        }
        assert.equal(editSeen.size, 24);
        await page
          .getByRole("radio", { name: "Browse all", exact: true })
          .click();
        await page
          .getByText(`${allUnique} finds · page 1 of ${allPages}`, {
            exact: true,
          })
          .waitFor();
        const allSeen = new Set(await cardKeys(page));
        for (let n = 2; n <= allPages; n++) {
          await page
            .getByRole("button", { name: "Next page", exact: true })
            .click();
          await focusIs(page, page.locator("#discover-results-title"));
          for (const id of await cardKeys(page)) {
            assert.ok(!allSeen.has(id));
            allSeen.add(id);
          }
        }
        assert.equal(allSeen.size, allUnique);
        assert.equal(await cards(page).count(), allUnique % 6 || 6);
        captures.push(await capture(page, output, `${key}-last-page`));
        for (let n = 0; n < categories.length; n++) {
          await chooseCategory(page, categories[n]);
          await page
            .getByText(
              `${loadedCounts[n]} finds · page 1 of ${Math.ceil(loadedCounts[n] / 6)}`,
              { exact: true },
            )
            .waitFor();
          assert.equal(
            new URL(page.url()).searchParams.get("category"),
            categories[n],
          );
          captures.push(await capture(page, output, `${key}-${categories[n]}`));
        }
        const search = page.getByRole("searchbox", {
          name: "Search across campus",
          exact: true,
        });
        await chooseCategory(page, "resources");
        await search.fill("ITT 315");
        await page
          .getByRole("heading", {
            name: "Normalization walkthrough",
            exact: true,
          })
          .waitFor();
        assert.equal(await cards(page).count(), resourceCourseIds.length);
        assert.deepEqual(
          new Set(await cardKeys(page)),
          new Set(resourceCourseIds),
        );
        await page.reload({ waitUntil: "networkidle" });
        assert.equal(await search.inputValue(), "ITT 315");
        assert.equal(await cards(page).count(), resourceCourseIds.length);
        assert.deepEqual(
          new Set(await cardKeys(page)),
          new Set(resourceCourseIds),
        );
        captures.push(await capture(page, output, `${key}-deep-link-reload`));
        await search.fill("");
        await chooseCategory(page, "events");
        await chooseCategory(page, "marketplace");
        await page.goBack();
        assert.equal(
          await page
            .getByRole("combobox", {
              name: "Filter discovery category",
              exact: true,
            })
            .inputValue(),
          "events",
        );
        await page.goForward();
        assert.equal(
          await page
            .getByRole("combobox", {
              name: "Filter discovery category",
              exact: true,
            })
            .inputValue(),
          "marketplace",
        );
        await page
          .getByRole("button", { name: "Reset filters", exact: true })
          .click();
        await search.fill("  INNOVÁTION NIGHT  ");
        await page
          .getByRole("heading", { name: "Innovation Night", exact: true })
          .waitFor();
        assert.equal(await cards(page).count(), 1);
        captures.push(await capture(page, output, `${key}-search`));
        await search.fill("no-such-campus-record");
        await page
          .getByText("Nothing here matches just yet.", { exact: true })
          .waitFor();
        captures.push(await capture(page, output, `${key}-search-empty`));
        await page
          .getByRole("button", { name: "Reset filters", exact: true })
          .click();
        await page.getByRole("radio", { name: "Saved", exact: true }).click();
        await page
          .getByText("A little collection, waiting to happen.", { exact: true })
          .waitFor();
        captures.push(await capture(page, output, `${key}-saved-empty`));
        await page
          .getByRole("button", { name: "Reset filters", exact: true })
          .click();
        await page
          .getByRole("radio", { name: "Browse all", exact: true })
          .click();
        await page
          .getByRole("combobox", {
            name: "Sort discovery results",
            exact: true,
          })
          .selectOption("name");
        const names = await cards(page).locator("h3").allTextContents();
        assert.deepEqual(
          names,
          [...names].sort((a, b) => a.localeCompare(b, "en-GH")),
        );
        await page
          .getByRole("link", { name: "Find your people.", exact: true })
          .click();
        await page.waitForURL(
          (url) =>
            url.pathname === "/discover" &&
            url.searchParams.get("category") === "clubs",
        );
        await cards(page).first().waitFor();
        assert.ok((await cardKeys(page)).every((k) => k.startsWith("clubs:")));
        assert.deepEqual(errors, []);
        console.log(
          "Discover eight categories/edit/all/search/URL/history/pages",
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
    editUnique: 24,
    allUnique,
    eightCategories: true,
    urlReloadBackForward: true,
    composedSearchSort: true,
  };
}
