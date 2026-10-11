import assert from "node:assert/strict";
import { authContext, visit, capture, eventCards, trackErrors, focusIs } from "./helpers.mjs";
export async function directoryChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-directory`;
      try {
        await visit(page, base, "/events");
        assert.equal(await eventCards(page).count(), 6);
        await page.getByRole("heading", { name: "Innovation Night", exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-upcoming`));
        await page.getByLabel("When to explore").selectOption("all");
        const seen = new Set(
          await eventCards(page).evaluateAll((nodes) =>
            nodes.map((n) => n.getAttribute("aria-label")),
          ),
        );
        for (const n of [2, 3]) {
          await page.getByRole("button", { name: `Page ${n}`, exact: true }).click();
          await focusIs(page, page.locator("#event-directory-title"));
          assert.equal(await eventCards(page).count(), n === 2 ? 6 : 4);
          for (const name of await eventCards(page).evaluateAll((nodes) =>
            nodes.map((n) => n.getAttribute("aria-label")),
          )) {
            assert.ok(!seen.has(name));
            seen.add(name);
          }
          if (n === 3) captures.push(await capture(page, output, `${key}-last-page`));
        }
        assert.equal(seen.size, 16);
        await page.getByRole("button", { name: "Career", exact: true }).click();
        assert.equal(await eventCards(page).count(), 3);
        await page.getByRole("button", { name: "All interests", exact: true }).click();
        await page.getByLabel("When to explore").selectOption("week");
        assert.equal(await eventCards(page).count(), 6);
        await page.getByLabel("Sort events").selectOption("name");
        const names = await eventCards(page).locator("h3").allTextContents();
        assert.deepEqual(
          names,
          [...names].sort((a, b) => a.localeCompare(b, "en-GH")),
        );
        await page.getByLabel("Sort events").selectOption("popular");
        assert.match(await eventCards(page).first().textContent(), /Innovation Night/);
        await page.getByLabel("When to explore").selectOption("all");
        await page.getByRole("checkbox", { name: "Free events only", exact: true }).check();
        assert.ok(
          !(await eventCards(page).allTextContents()).some((text) => /listed entry fee/.test(text)),
        );
        await page.getByRole("checkbox", { name: "Free events only", exact: true }).uncheck();
        await page.getByLabel("When to explore").selectOption("past");
        assert.equal(await eventCards(page).count(), 1);
        captures.push(await capture(page, output, `${key}-past`));
        await page.getByLabel("When to explore").selectOption("upcoming");
        await page.getByRole("button", { name: "My RSVPs", exact: true }).click();
        await page.getByText("Your next plan starts here.", { exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-my-empty`));
        await page.getByRole("button", { name: "Saved events", exact: true }).click();
        await page.getByText("A little space for good plans.", { exact: true }).waitFor();
        await page.getByRole("button", { name: "Reset event filters", exact: true }).click();
        const search = page.getByLabel("Search events", { exact: true });
        await search.fill("  INNOVÁTION NIGHT  ");
        assert.equal(await eventCards(page).count(), 1);
        await search.fill("no-such-event");
        await page.getByText("No plans found — yet.", { exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-search-empty`));
        await page.getByRole("button", { name: "Reset event filters", exact: true }).click();
        assert.equal(await search.inputValue(), "");
        assert.equal(await eventCards(page).count(), 6);
        assert.deepEqual(errors, []);
        console.log("Event directory filters/pages", width, theme, "passed");
      } finally {
        await context.close();
      }
    }
  return { captures, uniqueRecords: 16, composedFilters: true, realPagination: true };
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
          await visit(page, base, `/events/e${n}`);
          assert.equal(await page.locator("h1").count(), 1);
          assert.match(await page.title(), /CampusOne/);
          await page
            .getByRole("heading", { name: "The people behind the plan.", exact: true })
            .waitFor();
          assert.ok(await page.locator(".event-detail-actions").isVisible());
          if (width < 1024) {
            const actions = await page.locator(".event-detail-actions").boundingBox(),
              nav = await page
                .getByRole("navigation", { name: "Mobile navigation", exact: true })
                .boundingBox();
            assert.ok(nav, "Mobile navigation exists");
            assert.ok(actions.y + actions.height < nav.y, "Event actions clear mobile navigation");
          }
          if ([5, 15, 16].includes(n))
            assert.equal(
              await page.locator(".event-detail-actions button").first().isDisabled(),
              true,
            );
          captures.push(await capture(page, output, `${width}-${theme}-event-e${n}`));
        }
        assert.deepEqual(errors, []);
        console.log("Sixteen event details", width, theme, "passed");
      } finally {
        await context.close();
      }
    }
  return { captures, routes: 16, pageExceptions: [] };
}
