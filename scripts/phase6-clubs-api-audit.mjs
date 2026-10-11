import "./foundation/load-typescript.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
const { startClubFixture } = await import("./phase6/clubs/api-fixture.mjs");
import { authContext, visit, capture, clubCards, trackErrors } from "./phase6/clubs/helpers.mjs";
const base = process.env.AUDIT_API_BASE_URL ?? "http://127.0.0.1:3002",
  output = process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase6/clubs/api-browser";
await mkdir(output, { recursive: true });
const fixture = await startClubFixture(),
  browser = await launchAuditBrowser([], { multiProcess: true }),
  captures = [];
try {
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      fixture.reset();
      fixture.state.catalogMode = "error";
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-api`;
      await context.addCookies([
        { name: "campus_session", value: "fixture-session-only", url: base },
        { name: "other_private", value: "not-forwarded-on-ssr", url: base },
      ]);
      try {
        await visit(page, base, "/clubs");
        await page.getByText("The communities need another moment.", { exact: true }).waitFor();
        assert.equal(await clubCards(page).count(), 0);
        captures.push(await capture(page, output, `${key}-catalog-error`));
        fixture.state.catalogMode = "ok";
        await page.getByRole("button", { name: "Try again", exact: true }).click();
        await page.getByRole("heading", { name: "Code Collective", exact: true }).waitFor();
        assert.equal(await clubCards(page).count(), 6);
        await page
          .getByText("Search and filters apply to the 30 loaded clubs of 35.", { exact: true })
          .waitFor();
        fixture.state.catalogDelay = 800;
        await page.getByRole("button", { name: "Load more clubs", exact: true }).click();
        await page.getByRole("button", { name: "Loading more clubs…", exact: true }).waitFor();
        await page
          .getByRole("button", { name: "Loading more clubs…", exact: true })
          .waitFor({ state: "hidden" });
        assert.equal(
          await page
            .getByText("Search and filters apply to the 30 loaded clubs of 35.", { exact: true })
            .count(),
          0,
        );
        fixture.state.catalogDelay = 0;
        captures.push(await capture(page, output, `${key}-catalog-retry-more`));
        fixture.state.activityMode = "error";
        await visit(page, base, "/clubs/club-3");
        await page
          .getByText("Your membership activity needs another try.", { exact: true })
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", { name: "Membership unavailable", exact: true })
            .isDisabled(),
          true,
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Save Robotics Studio", exact: true })
            .isDisabled(),
          true,
        );
        captures.push(await capture(page, output, `${key}-activity-error`));
        fixture.state.activityMode = "ok";
        await page.getByRole("button", { name: "Try again", exact: true }).click();
        await page.getByRole("button", { name: "Request to join", exact: true }).waitFor();
        fixture.state.mutationMode = "error";
        await page.getByRole("button", { name: "Request to join", exact: true }).click();
        const dialog = page.getByRole("dialog");
        await dialog
          .getByLabel("A little introduction (optional)")
          .fill("Connected mock API introduction.");
        await dialog.getByRole("checkbox").check();
        const submit = dialog.getByRole("button", {
          name: "Submit membership request",
          exact: true,
        });
        await submit.click();
        await dialog
          .getByText("CampusOne couldn't complete this request. Please retry.", { exact: true })
          .waitFor();
        assert.ok(!fixture.state.memberships.some((m) => m.clubId === "club-3"));
        captures.push(await capture(page, output, `${key}-mutation-error`));
        fixture.state.mutationMode = "ok";
        fixture.state.mutationDelay = 300;
        const before = fixture.hits.filter((h) => h.method === "POST").length;
        await submit.evaluate((button) => {
          button.click();
          button.click();
        });
        await dialog.waitFor({ state: "hidden" });
        await page.getByText("Membership: pending", { exact: true }).waitFor();
        assert.equal(fixture.hits.filter((h) => h.method === "POST").length, before + 1);
        assert.equal(
          fixture.state.memberships.find((m) => m.clubId === "club-3").note,
          "Connected mock API introduction.",
        );
        await page.getByRole("button", { name: "Save Robotics Studio", exact: true }).click();
        await page.getByRole("button", { name: "Unsave Robotics Studio", exact: true }).waitFor();
        await page.reload({ waitUntil: "networkidle" });
        await page.getByRole("button", { name: "Unsave Robotics Studio", exact: true }).waitFor();
        await page.getByText("Membership: pending", { exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-connected-persist`));
        await page.getByRole("button", { name: "Withdraw request", exact: true }).click();
        await dialog.getByRole("button", { name: "Withdraw request", exact: true }).click();
        await page.getByRole("button", { name: "Request to join", exact: true }).waitFor();
        assert.ok(!fixture.state.memberships.some((m) => m.clubId === "club-3"));
        await visit(page, base, "/clubs");
        const panel = page.locator("#executive-reviews");
        await panel.getByRole("heading", { name: "Club executive reviews", exact: true }).waitFor();
        await panel
          .getByRole("group", { name: "Membership request for Debate Assembly", exact: true })
          .getByRole("button", { name: "Approve", exact: true })
          .click();
        await panel.getByText("No pending requests right now.", { exact: true }).waitFor();
        assert.equal(fixture.state.memberships.find((m) => m.id === "m2").status, "approved");
        await visit(page, base, "/clubs/club-34");
        await page.getByText("Fee not supplied", { exact: true }).first().waitFor();
        captures.push(await capture(page, output, `${key}-legacy-fields`));
        await visit(page, base, "/clubs/club-35");
        assert.equal(
          await page.getByRole("button", { name: "Request to join", exact: true }).isDisabled(),
          true,
        );
        assert.ok(
          fixture.hits
            .filter((h) => h.path === "/api/clubs" && h.search.includes("page=1"))
            .every((h) => h.cookie === "campus_session=fixture-session-only"),
        );
        assert.deepEqual(errors, []);
        console.log(
          "Mocked API catalog/retry/mutations/legacy/cookie allowlist",
          width,
          theme,
          "passed",
        );
      } finally {
        await context.close();
      }
    }
  await writeFile(
    `${output}/checks.json`,
    JSON.stringify(
      {
        captures,
        mocked: true,
        realBackendVerified: false,
        ssrCookieAllowlist: true,
        relativeBrowserApi: true,
        singleFlightMutation: true,
        noDemoFallback: true,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  fixture.server.closeAllConnections();
  await new Promise((resolve) => fixture.server.close(resolve));
}
