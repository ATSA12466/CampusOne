import { readdir, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { authContext, visit, capture, stored, rsvp, trackErrors } from "./helpers.mjs";
export { clockChecks } from "./clock.mjs";
export async function privacyChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-privacy`;
      try {
        await visit(page, base, "/events/e1");
        await rsvp(page);
        await page.getByRole("button", { name: "Save Innovation Night", exact: true }).click();
        await page.getByRole("button", { name: "Unsave Innovation Night", exact: true }).waitFor();
        await visit(page, base, "/sign-in?next=%2Fevents");
        await page.getByLabel(/^Email/).fill("second.event.profile@campusone.demo");
        await page.getByRole("button", { name: "Sign in (demo)", exact: true }).click();
        await page.waitForURL((url) => url.pathname === "/events");
        let state = await stored(page, "campusone-app");
        assert.deepEqual(state.registrations, []);
        assert.equal(state.bookmarks.filter((b) => b.entityType === "event").length, 0);
        await page.getByRole("button", { name: "My RSVPs", exact: true }).click();
        captures.push(await capture(page, output, `${key}-second-profile`));
        await visit(page, base, "/events/e1");
        await rsvp(page);
        const second = await context.newPage();
        await visit(second, base, "/events/e1");
        await second.getByRole("button", { name: "Demo ticket", exact: true }).click();
        await second
          .getByRole("dialog")
          .getByRole("img", { name: "Demonstration QR — not valid for entry", exact: true })
          .waitFor();
        await visit(page, base, "/settings");
        await page.getByRole("button", { name: "Sign out", exact: true }).click();
        await page.waitForURL((url) => url.pathname === "/sign-in");
        await second.getByRole("dialog").waitFor({ state: "hidden" });
        await second.getByRole("link", { name: "Sign in to RSVP", exact: true }).waitFor();
        assert.equal(
          await second
            .getByRole("img", { name: "Demonstration QR — not valid for entry", exact: true })
            .count(),
          0,
        );
        assert.equal(
          await second
            .getByRole("button", { name: "Save Innovation Night", exact: true })
            .isDisabled(),
          true,
        );
        captures.push(await capture(second, output, `${key}-cross-tab-guest`));
        await second.reload({ waitUntil: "domcontentloaded" });
        await second.getByRole("link", { name: "Sign in to RSVP", exact: true }).waitFor();
        state = await stored(second, "campusone-app");
        assert.deepEqual(state.registrations, []);
        assert.deepEqual(state.bookmarks, []);
        assert.deepEqual(errors, []);
        console.log("Event profile isolation/cross-tab ticket logout", width, theme, "passed");
      } finally {
        await context.close();
      }
    }
  return {
    captures,
    profileIsolation: true,
    crossTabTicketUnloaded: true,
    guestSafe: true,
    signedOutSurvivesReload: true,
  };
}
export async function resilienceChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-resilience`;
      try {
        await visit(page, base, "/events/e1");
        await page.evaluate(() => {
          const original = Storage.prototype.setItem;
          Storage.prototype.setItem = function (key, value) {
            if (key === "campusone-app") throw new DOMException("Storage blocked", "SecurityError");
            return original.call(this, key, value);
          };
        });
        await rsvp(page);
        await page
          .getByText("Saved for this visit only. Device storage is unavailable.", { exact: true })
          .waitFor();
        captures.push(await capture(page, output, `${key}-visit-only`));
        await page.reload({ waitUntil: "networkidle" });
        await page.getByRole("button", { name: "RSVP", exact: true }).waitFor();
        assert.ok(!((await stored(page, "campusone-app"))?.registrations ?? []).includes("e1"));
        await context.route("**/_next/image?*", (route) =>
          route.request().url().includes("event-showcase.webp")
            ? route.abort("failed")
            : route.continue(),
        );
        await page.reload({ waitUntil: "networkidle" });
        await page.getByText("Photo coming soon", { exact: true }).first().waitFor();
        captures.push(await capture(page, output, `${key}-photo-fallback`));
        assert.deepEqual(errors, []);
        console.log("Event denied storage/next-image fallback", width, theme, "passed");
      } finally {
        await context.close();
      }
    }
  return {
    captures,
    verifiedVisitOnlyMutation: true,
    noFakePersistence: true,
    photoFallback: true,
  };
}
export async function deliveryChecks(browser, base, output) {
  const captures = [];
  const context = await authContext(browser, base, 360, "dark"),
    page = await context.newPage(),
    errors = trackErrors(page);
  const qrFiles = [];
  for (const name of await readdir(".next/static/chunks"))
    if (
      name.endsWith(".js") &&
      (await readFile(`.next/static/chunks/${name}`, "utf8")).includes("Data too long")
    )
      qrFiles.push(name);
  assert.equal(qrFiles.length, 1, "One existing QR bundle is isolated by ticket intent");
  const fetched = new Set();
  page.on("request", (request) => {
    if (request.url().includes("/_next/static/chunks/"))
      fetched.add(new URL(request.url()).pathname.split("/").at(-1));
  });
  try {
    await visit(page, base, "/events/e1");
    assert.ok(!fetched.has(qrFiles[0]), "No QR code is downloaded during event browsing");
    let hits = 0;
    await page.route("**/_next/static/chunks/*.js", (route) => {
      hits++;
      return route.abort("failed");
    });
    await page.getByRole("button", { name: "Save Innovation Night", exact: true }).click();
    await page
      .getByText(
        "The event action service could not load. Restore your connection, save your work and reload before trying again.",
        { exact: true },
      )
      .first()
      .waitFor();
    assert.ok(hits > 0);
    assert.ok(
      !((await stored(page, "campusone-app"))?.bookmarks ?? []).some(
        (b) => b.entityType === "event",
      ),
    );
    captures.push(await capture(page, output, "360-dark-event-action-delivery-error"));
    await page.unroute("**/_next/static/chunks/*.js");
    await page.reload({ waitUntil: "networkidle" });
    await rsvp(page);
    assert.ok(!fetched.has(qrFiles[0]), "RSVP does not download QR code");
    hits = 0;
    await page.route("**/_next/static/chunks/*.js", (route) => {
      hits++;
      return route.abort("failed");
    });
    await page.getByRole("button", { name: "Demo ticket", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByText("The ticket preview could not load.", { exact: true })
      .waitFor();
    assert.ok(hits > 0);
    assert.equal(
      await page
        .getByRole("img", { name: "Demonstration QR — not valid for entry", exact: true })
        .count(),
      0,
    );
    assert.deepEqual((await stored(page, "campusone-app")).registrations, ["e1"]);
    captures.push(await capture(page, output, "360-dark-ticket-code-delivery-error"));
    await page.unroute("**/_next/static/chunks/*.js");
    await page.getByRole("button", { name: "Reload ticket preview", exact: true }).click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Demo ticket", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("img", { name: "Demonstration QR — not valid for entry", exact: true })
      .waitFor();
    assert.deepEqual(errors, []);
    return {
      captures,
      actionChunkOutageNoMutation: true,
      ticketChunkOutageNoQr: true,
      reloadRecovers: true,
      qrCodeFetchedOnlyOnTicketIntent: true,
    };
  } finally {
    await context.close();
  }
}
