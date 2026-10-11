import assert from "node:assert/strict";
import { authContext, visit, capture, cards, trackErrors } from "./helpers.mjs";
export async function clockChecks(browser, base, output) {
  const captures = [];
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-clock`;
      try {
        await page.clock.install({ time: new Date("2026-10-16T17:29:00Z") });
        await visit(
          page,
          base,
          "/discover?category=events&view=all&q=Innovation%20Night",
        );
        await cards(page)
          .getByText("Explore & RSVP", { exact: true })
          .waitFor();
        await page.clock.fastForward(60000);
        await cards(page)
          .getByText("Bookings closed", { exact: true })
          .waitFor();
        captures.push(await capture(page, output, `${key}-minute-deadline`));
        await page.clock.setFixedTime(new Date("2026-10-16T21:00:00Z"));
        await page.evaluate(() =>
          document.dispatchEvent(new Event("visibilitychange")),
        );
        await cards(page).getByText("Event ended", { exact: true }).waitFor();
        captures.push(await capture(page, output, `${key}-visibility-ended`));
        assert.deepEqual(errors, []);
        console.log(
          "Discover minute/visibility status updates",
          width,
          theme,
          "passed",
        );
      } finally {
        await context.close();
      }
    }
  return { captures, minuteDeadline: true, visibilityEnded: true };
}
