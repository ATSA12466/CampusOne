import assert from "node:assert/strict";
import {
  authContext,
  visit,
  capture,
  stored,
  trackErrors,
} from "./helpers.mjs";
export async function privacyChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-privacy`;
      try {
        await visit(page, base, "/discover?category=accommodation&view=all");
        await page
          .getByRole("button", { name: "Save BlueNest Residence", exact: true })
          .click();
        await page
          .getByRole("button", {
            name: "Unsave BlueNest Residence",
            exact: true,
          })
          .waitFor();
        await visit(page, base, "/sign-in?next=%2Fdiscover");
        await page
          .getByLabel(/^Email/)
          .fill("another.discover.profile@campusone.demo");
        await page
          .getByRole("button", { name: "Sign in (demo)", exact: true })
          .click();
        await page.waitForURL((url) => url.pathname === "/discover");
        await page.getByRole("radio", { name: "Saved", exact: true }).click();
        await page
          .getByText("A little collection, waiting to happen.", { exact: true })
          .waitFor();
        assert.deepEqual((await stored(page, "campusone-app")).bookmarks, []);
        captures.push(await capture(page, output, `${key}-second-profile`));
        await visit(
          page,
          base,
          "/discover?category=events&view=all&q=Innovation%20Night",
        );
        await page
          .getByRole("button", { name: "Save Innovation Night", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Unsave Innovation Night", exact: true })
          .waitFor();
        const second = await context.newPage(),
          secondErrors = trackErrors(second);
        await visit(second, base, "/discover?view=saved");
        await second
          .getByRole("heading", { name: "Innovation Night", exact: true })
          .waitFor();
        await visit(page, base, "/settings");
        await page
          .getByRole("button", { name: "Sign out", exact: true })
          .click();
        await page.waitForURL((url) => url.pathname === "/sign-in");
        await second
          .getByText("A profile keeps your finds together.", { exact: true })
          .waitFor();
        assert.equal(
          await second
            .getByRole("heading", { name: "Innovation Night", exact: true })
            .count(),
          0,
        );
        captures.push(await capture(second, output, `${key}-cross-tab-guest`));
        await second.reload({ waitUntil: "domcontentloaded" });
        await second
          .getByText("A profile keeps your finds together.", { exact: true })
          .waitFor();
        assert.deepEqual((await stored(second, "campusone-app")).bookmarks, []);
        assert.deepEqual(errors, []);
        assert.deepEqual(secondErrors, []);
        console.log(
          "Discover profile/email isolation, cross-tab logout and guest reload",
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
    profileIsolation: true,
    crossTabPrivateCollectionCleared: true,
    guestReload: true,
  };
}
