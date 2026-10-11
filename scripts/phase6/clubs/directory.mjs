import assert from "node:assert/strict";
import { authContext, visit, capture, clubCards, trackErrors, focusIs } from "./helpers.mjs";
export async function directoryChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-directory`;
      try {
        await visit(page, base, "/clubs");
        assert.equal(await clubCards(page).count(), 6);
        await page.getByRole("heading", { name: "Code Collective", exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-all`));
        const seen = new Set(
          await clubCards(page).evaluateAll((nodes) =>
            nodes.map((n) => n.getAttribute("aria-labelledby")),
          ),
        );
        for (const n of [2, 3]) {
          await page.getByRole("button", { name: `Page ${n}`, exact: true }).click();
          await focusIs(page, page.locator("#directory-title"));
          assert.equal(await clubCards(page).count(), n === 2 ? 6 : 4);
          for (const id of await clubCards(page).evaluateAll((nodes) =>
            nodes.map((n) => n.getAttribute("aria-labelledby")),
          )) {
            assert.ok(!seen.has(id));
            seen.add(id);
          }
          if (n === 3) captures.push(await capture(page, output, `${key}-last-page`));
        }
        assert.equal(seen.size, 16);
        await page.getByRole("button", { name: "Technology", exact: true }).click();
        assert.equal(await clubCards(page).count(), 3);
        await page.getByRole("button", { name: "All interests", exact: true }).click();
        await page.getByLabel("Sort clubs").selectOption("name");
        const names = await clubCards(page).locator("h3").allTextContents();
        assert.deepEqual(
          names,
          [...names].sort((a, b) => a.localeCompare(b, "en-GH")),
        );
        await page.getByLabel("Sort clubs").selectOption("members");
        assert.match(await clubCards(page).first().textContent(), /154 members/);
        await page.getByRole("button", { name: "My communities", exact: true }).click();
        assert.equal(await clubCards(page).count(), 2);
        captures.push(await capture(page, output, `${key}-mine`));
        await page.getByRole("button", { name: "Saved clubs", exact: true }).click();
        await page.getByText("Your next community is waiting.", { exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-saved-empty`));
        await page.getByRole("button", { name: "Explore all clubs", exact: true }).click();
        const search = page.getByLabel("Search clubs", { exact: true });
        await search.fill("  CÓDE  ");
        assert.equal(await clubCards(page).count(), 1);
        await search.fill("no-such-community");
        await page.getByText("No clubs match this combination.", { exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-search-empty`));
        await page.getByRole("button", { name: "Explore all clubs", exact: true }).click();
        assert.equal(await search.inputValue(), "");
        assert.equal(await clubCards(page).count(), 6);
        assert.deepEqual(errors, []);
        console.log("Directory filters/pages", width, theme, "passed");
      } finally {
        await context.close();
      }
    }
  return { captures, uniqueRecords: 16, realPagination: true, composedFilters: true };
}
export async function detailMatrix(browser, base, output) {
  const captures = [];
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page);
      try {
        for (let n = 1; n <= 16; n++) {
          await visit(page, base, `/clubs/club-${n}`);
          assert.equal(await page.locator("h1").count(), 1);
          assert.match(await page.title(), /CampusOne/);
          await page.getByRole("heading", { name: "Meet the welcome crew", exact: true }).waitFor();
          assert.ok(await page.locator(".club-detail-actions").isVisible());
          if (width < 1024) {
            const actions = await page.locator(".club-detail-actions").boundingBox(),
              nav = await page
                .getByRole("navigation", { name: "Mobile navigation", exact: true })
                .boundingBox();
            assert.ok(nav, "Mobile navigation is present");
            assert.ok(actions.y + actions.height < nav.y, "Membership actions clear navigation");
          }
          captures.push(await capture(page, output, `${width}-${theme}-club-${n}`));
        }
        assert.deepEqual(errors, []);
        console.log("Sixteen detail routes", width, theme, "passed");
      } finally {
        await context.close();
      }
    }
  return { captures, routes: 16, pageExceptions: [] };
}
