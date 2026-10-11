import assert from "node:assert/strict";
import {
  authContext,
  visit,
  capture,
  stored,
  cards,
  trackErrors,
} from "./helpers.mjs";
export async function deliveryChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-delivery`;
      try {
        await page.route("**/_next/static/chunks/*.js", (route) =>
          route.abort("failed"),
        );
        await visit(page, base, "/discover");
        assert.equal(await cards(page).count(), 6);
        assert.equal(
          await page
            .getByRole("heading", { name: "Innovation Night", exact: true })
            .count(),
          1,
        );
        assert.equal(await page.locator(".discover-hero img").count(), 1);
        captures.push(await capture(page, output, `${key}-ssr-no-hydration`));
        await page.unroute("**/_next/static/chunks/*.js");
        await page.reload({ waitUntil: "networkidle" });
        await page
          .getByRole("button", { name: "Save Innovation Night", exact: true })
          .waitFor();
        let blocked = 0;
        await page.route("**/_next/static/chunks/*.js", (route) => {
          blocked++;
          return route.abort("failed");
        });
        await page
          .getByRole("button", { name: "Save Innovation Night", exact: true })
          .click();
        await page
          .getByText(
            "The save service could not load. Restore your connection, save your work and reload before trying again.",
            { exact: true },
          )
          .first()
          .waitFor();
        assert.ok(blocked > 0);
        assert.deepEqual(
          (await stored(page, "campusone-app"))?.bookmarks ?? [],
          [],
        );
        captures.push(await capture(page, output, `${key}-action-code-outage`));
        await page.unroute("**/_next/static/chunks/*.js");
        await page.reload({ waitUntil: "networkidle" });
        await page
          .getByRole("button", { name: "Save Innovation Night", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Unsave Innovation Night", exact: true })
          .waitFor();
        assert.equal((await stored(page, "campusone-app")).bookmarks.length, 1);
        assert.deepEqual(errors, []);
        console.log(
          "Discover server-visible content and safe intent-loaded save-code recovery",
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
    ssrContentWithoutHydration: true,
    saveCodeIntentLoaded: true,
    codeOutageNoMutation: true,
    reloadRecovery: true,
  };
}
