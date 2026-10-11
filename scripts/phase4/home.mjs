import assert from "node:assert/strict";
import { screenMetrics } from "../audit/browser.mjs";
import { homeContext, visit, capture, focusIs } from "./helpers.mjs";
export async function checkHome(browser, baseUrl, output) {
  const cases = [];
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await homeContext(browser, baseUrl, width, theme),
        page = await context.newPage(),
        errors = [],
        media = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (/\.(webm|vtt)(?:\?|$)/.test(request.url())) media.push(request.url());
      });
      try {
        await visit(page, baseUrl);
        assert.equal(await page.locator("video").count(), 0);
        assert.deepEqual(media, []);
        const featured = page.locator('section[aria-label="Featured ads and video"]'),
          clubs = page.locator('section[aria-labelledby="home-clubs-title"]');
        assert.ok((await featured.boundingBox()).y < (await clubs.boundingBox()).y);
        const portals = [
          ["LMS", "https://lms.gctu.edu.gh/"],
          ["SIP", "https://sip.gctu.edu.gh/"],
        ];
        for (const [name, href] of portals) {
          const link = page.getByRole("link", {
            name: `Open GCTU ${name} in a new tab`,
            exact: true,
          });
          assert.equal(await link.getAttribute("href"), href);
          assert.equal(await link.getAttribute("target"), "_blank");
          assert.equal(await link.getAttribute("rel"), "noopener noreferrer");
        }
        const lane = page.getByRole("region", { name: "Photo shortcuts", exact: true });
        assert.deepEqual(
          await lane
            .locator("a")
            .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href"))),
          [
            "/events",
            "/academics",
            "/opportunities",
            "/accommodation",
            "/marketplace",
            "/discover",
          ],
        );
        const initial = await capture(page, output, `${width}-${theme}-home`);
        const carousel = page.locator('[aria-roledescription="carousel"]');
        await carousel.focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForFunction(
          () =>
            document.querySelector('[aria-label="Go to slide 2"]')?.getAttribute("aria-current") ===
            "true",
        );
        const videoSlide = await capture(page, output, `${width}-${theme}-video-slide`);
        await carousel.focus();
        await page.keyboard.press("ArrowLeft");
        await page.waitForFunction(
          () =>
            document.querySelector('[aria-label="Go to slide 1"]')?.getAttribute("aria-current") ===
            "true",
        );
        assert.equal(
          await page.getByRole("button", { name: "Previous slide", exact: true }).isDisabled(),
          true,
        );
        const task = page.getByRole("button", { name: /^Complete / }).first(),
          label = await task.getAttribute("aria-label");
        await task.click();
        await page.getByRole("status").filter({ hasText: "Task marked complete" }).waitFor();
        assert.equal(
          await page.getByRole("progressbar", { name: "Completed tasks" }).getAttribute("value"),
          "1",
        );
        const undo = page.getByRole("button", { name: "Undo", exact: true });
        await focusIs(page, undo);
        await undo.click();
        const restored = page.getByRole("button", { name: label, exact: true });
        await focusIs(page, restored);
        assert.equal(
          await page.getByRole("progressbar", { name: "Completed tasks" }).getAttribute("value"),
          "0",
        );
        await restored.click();
        await page.reload({ waitUntil: "networkidle" });
        assert.equal(
          await page.getByRole("progressbar", { name: "Completed tasks" }).getAttribute("value"),
          "1",
        );
        assert.equal(await page.getByRole("button", { name: label, exact: true }).count(), 0);
        const completed = await capture(page, output, `${width}-${theme}-task-completed`);
        await lane.evaluate((node) =>
          node.scrollTo({ left: node.scrollWidth, behavior: "instant" }),
        );
        assert.ok(await lane.evaluate((node) => node.scrollLeft > 0));
        assert.equal((await page.evaluate(screenMetrics)).documentWidth, width);
        // Progressive below-fold paint must not make recommendations unreachable.
        const recommendation = page.locator('.home-recommendations a[href="/opportunities/o2"]');
        await recommendation.focus();
        const reachable = await recommendation.evaluate(async (element) => {
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          const bounds = element.getBoundingClientRect();
          const x = bounds.x + bounds.width / 2,
            y = bounds.y + bounds.height / 2;
          return (
            document.activeElement === element &&
            bounds.width > 0 &&
            bounds.height > 0 &&
            y > 80 &&
            y < innerHeight - 90 &&
            element.contains(document.elementFromPoint(x, y))
          );
        });
        assert.equal(
          reachable,
          true,
          "Below-fold recommendation is focused, painted and unobscured",
        );
        assert.deepEqual(errors, []);
        cases.push({
          width,
          theme,
          initial,
          videoSlide,
          completed,
          adsFirst: true,
          mediaDeferred: true,
          portals: true,
          taskUndoFocusAndPersistence: true,
          shortcutsSnapWithoutRootOverflow: true,
          recommendationKeyboardReachability: true,
        });
        console.log(`Home ${width}-${theme} passed`);
      } finally {
        await context.close();
      }
    }
  return cases;
}
