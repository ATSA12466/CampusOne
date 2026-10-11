import assert from "node:assert/strict";
import { authContext, visit, capture, stored, requestJoin, trackErrors } from "./helpers.mjs";
export async function privacyChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-privacy`;
      try {
        await visit(page, base, "/clubs/club-3");
        await requestJoin(page, "Private first-profile club introduction.");
        await page.getByRole("button", { name: "Save Robotics Studio", exact: true }).click();
        await page.getByRole("button", { name: "Unsave Robotics Studio", exact: true }).waitFor();
        await visit(page, base, "/sign-in?next=%2Fclubs");
        await page.getByLabel(/^Email/).fill("second.profile@campusone.demo");
        await page.getByRole("button", { name: "Sign in (demo)", exact: true }).click();
        await page.waitForURL((url) => url.pathname === "/clubs");
        let state = await stored(page, "campusone-app");
        assert.ok(!JSON.stringify(state).includes("Private first-profile club introduction."));
        assert.equal(state.bookmarks.filter((b) => b.entityType === "club").length, 0);
        await page.getByRole("button", { name: "Saved clubs", exact: true }).click();
        captures.push(await capture(page, output, `${key}-second-profile`));
        await visit(page, base, "/settings");
        await page.getByRole("button", { name: "Sign out", exact: true }).click();
        await page.waitForURL((url) => url.pathname === "/sign-in");
        await visit(page, base, "/clubs");
        await page.getByRole("link", { name: "Sign in to a profile", exact: true }).waitFor();
        assert.equal(
          await page.getByRole("button", { name: "Request to join", exact: true }).count(),
          0,
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Save Code Collective", exact: true })
            .isDisabled(),
          true,
        );
        captures.push(await capture(page, output, `${key}-guest`));
        await page.reload({ waitUntil: "networkidle" });
        state = await stored(page, "campusone-app");
        assert.deepEqual(state.memberships, []);
        assert.deepEqual(state.bookmarks, []);
        assert.deepEqual(errors, []);
        console.log("Profile isolation/sign-out", width, theme, "passed");
      } finally {
        await context.close();
      }
    }
  return { captures, profileIsolation: true, guestSafe: true, signedOutSurvivesReload: true };
}
export async function storageAndMediaChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-resilience`;
      try {
        await visit(page, base, "/clubs/club-3");
        await page.evaluate(() => {
          const original = Storage.prototype.setItem;
          Storage.prototype.setItem = function (key, value) {
            if (key === "campusone-app") throw new DOMException("Storage blocked", "SecurityError");
            return original.call(this, key, value);
          };
        });
        await page.getByRole("button", { name: "Save Robotics Studio", exact: true }).click();
        await page.getByRole("button", { name: "Unsave Robotics Studio", exact: true }).waitFor();
        await page
          .getByText("Saved for this visit only. Device storage is unavailable.", { exact: true })
          .waitFor();
        captures.push(await capture(page, output, `${key}-visit-only`));
        await page.reload({ waitUntil: "networkidle" });
        await page.getByRole("button", { name: "Save Robotics Studio", exact: true }).waitFor();
        assert.ok(
          !((await stored(page, "campusone-app"))?.bookmarks ?? []).some((b) => b.entityType === "club"),
        );
        await context.route("**/_next/image?*", (route) =>
          route.request().url().includes("club-makers.webp")
            ? route.abort("failed")
            : route.continue(),
        );
        await visit(page, base, "/clubs/club-1");
        await page.getByText("Photo coming soon", { exact: true }).first().waitFor();
        captures.push(await capture(page, output, `${key}-photo-fallback`));
        assert.deepEqual(errors, []);
        console.log("Storage denied/photo fallback", width, theme, "passed");
      } finally {
        await context.close();
      }
    }
  return { captures, blockedStorageVisitOnly: true, noFakePersist: true, photoFallback: true };
}
export async function deliveryChecks(browser, base, output) {
  const context = await authContext(browser, base, 360, "dark"),
    page = await context.newPage(),
    errors = trackErrors(page),
    captures = [];
  try {
    await visit(page, base, "/clubs/club-3");
    let hits = 0;
    await page.route("**/_next/static/chunks/*.js", (route) => {
      hits++;
      return route.abort("failed");
    });
    await page.getByRole("button", { name: "Save Robotics Studio", exact: true }).click();
    await page
      .getByText(
        "The club action service could not load. Restore your connection, save your work and reload before trying again.",
        { exact: true },
      )
      .first()
      .waitFor();
    assert.ok(hits > 0);
    assert.ok(
      !((await stored(page, "campusone-app"))?.bookmarks ?? []).some((b) => b.entityType === "club"),
    );
    captures.push(await capture(page, output, "360-dark-club-action-delivery-error"));
    await page.unroute("**/_next/static/chunks/*.js");
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Save Robotics Studio", exact: true }).click();
    await page.getByRole("button", { name: "Unsave Robotics Studio", exact: true }).waitFor();
    assert.deepEqual(errors, []);
    return { captures, chunkOutageNoMutation: true, reloadRecovers: true };
  } finally {
    await context.close();
  }
}
