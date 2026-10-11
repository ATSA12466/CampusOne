import assert from "node:assert/strict";
import { authContext, visit, capture, stored, trackErrors } from "./helpers.mjs";
export async function clockChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-clock`;
      try {
        await page.clock.install({ time: new Date("2026-10-16T17:28:00Z") });
        await visit(page, base, "/events/e1");
        const countdown = page.locator('[data-testid="event-countdown"]');
        assert.equal(await countdown.textContent(), "32m until it starts");
        await page.clock.fastForward(60000);
        await page.getByText("31m until it starts", { exact: true }).waitFor();
        await page.getByRole("button", { name: "RSVP", exact: true }).click();
        const dialog = page.getByRole("dialog");
        await dialog.getByRole("checkbox").check();
        await page.clock.setFixedTime(new Date("2026-10-16T17:30:00Z"));
        await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
        await dialog.getByRole("button", { name: "Confirm demo RSVP", exact: true }).click();
        await dialog
          .getByText(
            "This event is full, closed, cancelled or already over. Your RSVP was not added.",
            { exact: true },
          )
          .waitFor();
        assert.ok(!((await stored(page, "campusone-app"))?.registrations ?? []).includes("e1"));
        captures.push(await capture(page, output, `${key}-fresh-deadline-rejection`));
        await dialog.getByRole("button", { name: "Not now", exact: true }).click();
        await page.getByRole("button", { name: "RSVP closed", exact: true }).waitFor();
        assert.equal(
          await page.getByRole("button", { name: "RSVP closed", exact: true }).isDisabled(),
          true,
        );
        captures.push(await capture(page, output, `${key}-closed`));
        await page.clock.setFixedTime(new Date("2026-10-16T18:00:00Z"));
        await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
        await page.getByText("Happening now", { exact: true }).first().waitFor();
        captures.push(await capture(page, output, `${key}-live`));
        await page.clock.setFixedTime(new Date("2026-10-16T21:00:00Z"));
        await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
        await page.getByText("This event has ended", { exact: true }).waitFor();
        assert.equal(
          await page.getByRole("button", { name: "Event ended", exact: true }).isDisabled(),
          true,
        );
        captures.push(await capture(page, output, `${key}-ended`));
        assert.deepEqual(errors, []);
        console.log("Event clock/minute/visibility/fresh booking gate", width, theme, "passed");
      } finally {
        await context.close();
      }
    }
  return {
    captures,
    minuteUpdates: true,
    visibilityUpdates: true,
    freshServiceDeadlineGate: true,
    noBookingAfterClose: true,
  };
}
