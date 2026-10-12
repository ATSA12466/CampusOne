import assert from "node:assert/strict";
import { seedOnboarding, restrictToApp } from "../audit/browser.mjs";
import { capture, checkTrap, closeSearch, focusIs, visit } from "./helpers.mjs";
export async function checkShell(browser, baseUrl, output) {
  const cases = [];
  for (const width of [360, 768, 1280])
    for (const colorScheme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        colorScheme,
        reducedMotion: "reduce",
      });
      await seedOnboarding(context);
      await restrictToApp(context, baseUrl);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const captures = [];
      const prefix = `${width}-${colorScheme}`;
      try {
        await visit(page, baseUrl);
        assert.equal(await page.locator("html").getAttribute("data-theme"), colorScheme);
        captures.push(await capture(page, output, `${prefix}-home`));
        if (width === 1280) {
          const nav = page.getByRole("navigation", { name: "Campus navigation", exact: true });
          assert.equal(await nav.getByRole("link").count(), 24);
          assert.equal(
            await nav.getByRole("link", { name: "Home", exact: true }).getAttribute("aria-current"),
            "page",
          );
          await page.getByRole("button", { name: "Collapse sidebar", exact: true }).click();
          await page.waitForFunction(() => document.documentElement.dataset.sidebar === "compact");
          assert.equal(
            await page
              .locator(".campus-sidebar")
              .evaluate((node) => node.getBoundingClientRect().width),
            88,
          );
          captures.push(await capture(page, output, `${prefix}-compact`));
          await page.getByRole("button", { name: "Expand sidebar", exact: true }).click();
        }
        const trigger = page.getByRole("button", { name: "Search campus", exact: true });
        await trigger.focus();
        await page.keyboard.press("Control+k");
        const dialog = page.getByRole("dialog", { name: "Search campus", exact: true });
        const input = dialog.getByRole("combobox", { name: "Search campus content" });
        await dialog.waitFor();
        await focusIs(page, input);
        const options = dialog.getByRole("listbox").getByRole("option");
        await options.first().waitFor();
        assert.equal(await options.count(), 18);
        captures.push(await capture(page, output, `${prefix}-search`));
        const first = await input.getAttribute("aria-activedescendant");
        await input.press("ArrowDown");
        assert.notEqual(await input.getAttribute("aria-activedescendant"), first);
        await input.press("ArrowUp");
        assert.equal(await input.getAttribute("aria-activedescendant"), first);
        await input.press("ArrowUp");
        assert.equal(await options.last().getAttribute("aria-selected"), "true");
        await checkTrap(page, dialog);
        await input.focus();
        await input.fill("no-campus-match-xyz");
        await dialog.getByRole("heading", { name: "Nothing here, yet.", exact: true }).waitFor();
        captures.push(await capture(page, output, `${prefix}-empty`));
        await dialog.getByRole("combobox", { name: "Look in", exact: true }).selectOption("clubs");
        await input.fill("Code");
        await dialog.getByRole("option", { name: "Code Collective, Clubs", exact: true }).waitFor();
        assert.equal(await options.count(), 1);
        await dialog.getByRole("button", { name: "Clear search", exact: true }).click();
        await focusIs(page, input);
        await dialog
          .getByRole("heading", { name: "A little more to go on.", exact: true })
          .waitFor();
        await dialog.getByRole("combobox", { name: "Look in", exact: true }).selectOption("all");
        await input.fill("Code");
        await dialog.getByRole("option", { name: "Code Collective, Clubs", exact: true }).waitFor();
        await input.press("Enter");
        await page.waitForURL("**/clubs/club-1");
        await focusIs(page, page.locator("#main-content"));
        if (width < 1024) {
          const more = page.getByRole("button", { name: "More", exact: true });
          assert.equal(await more.getAttribute("aria-current"), "page");
          await more.click();
          const menu = page.getByRole("dialog", {
            name: "Your campus, within reach.",
            exact: true,
          });
          await menu.waitFor();
          const links = await menu
            .getByRole("link")
            .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
          assert.equal(links.length, 25);
          assert.equal(new Set(links).size, 25);
          assert.equal(
            await menu
              .getByRole("link", { name: "Clubs", exact: true })
              .getAttribute("aria-current"),
            "page",
          );
          await checkTrap(page, menu, 30);
          captures.push(await capture(page, output, `${prefix}-more`));
          await closeSearch(page, more);
          await more.click();
          await menu.waitFor();
          await menu.getByRole("link", { name: "Timetable", exact: true }).click();
          await page.waitForURL("**/timetable");
          await focusIs(page, page.locator("#main-content"));
        } else {
          await page
            .getByRole("navigation", { name: "Campus navigation", exact: true })
            .getByRole("link", { name: "Timetable", exact: true })
            .click();
          await page.waitForURL("**/timetable");
          await focusIs(page, page.locator("#main-content"));
        }
        await trigger.focus();
        await page.keyboard.press("Meta+k");
        await dialog.waitFor();
        await closeSearch(page, trigger, "Meta+k");
        await trigger.click();
        await dialog.waitFor();
        await closeSearch(page, trigger);
        assert.deepEqual(errors, []);
        cases.push({
          width,
          colorScheme,
          captures,
          allDestinations: 24,
          keyboardNavigation: true,
          focusTrapAndReturn: true,
          routeFocus: true,
          pageErrors: errors,
        });
        console.log(`Shell ${prefix} passed`);
      } finally {
        await context.close();
      }
    }
  return cases;
}
