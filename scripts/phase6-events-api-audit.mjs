import "./foundation/load-typescript.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
import { authContext, trackErrors } from "./phase6/events/helpers.mjs";
import { checkApiCatalog } from "./phase6/events/api-catalog.mjs";
import { checkApiRsvp } from "./phase6/events/api-rsvp.mjs";
import { checkApiTicket } from "./phase6/events/api-ticket.mjs";
import { checkApiLegacy } from "./phase6/events/api-legacy.mjs";
const { startEventFixture } = await import("./phase6/events/api-fixture.mjs"),
  base = process.env.AUDIT_API_BASE_URL ?? "http://127.0.0.1:3002",
  output = process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase6/events/api-browser";
await mkdir(output, { recursive: true });
const fixture = await startEventFixture(),
  browser = await launchAuditBrowser([], { multiProcess: true }),
  captures = [];
try {
  for (const width of [360, 1280])
    for (const theme of ["light", "dark"]) {
      fixture.reset();
      const context = await authContext(browser, base, width, theme),
        page = await context.newPage(),
        errors = trackErrors(page),
        key = `${width}-${theme}-api`;
      await context.addCookies([
        { name: "campus_session", value: "fixture-session-only", url: base },
        { name: "other_private", value: "not-forwarded-on-ssr", url: base },
      ]);
      try {
        captures.push(
          ...(await checkApiCatalog(page, base, output, key, fixture)),
          ...(await checkApiRsvp(page, base, output, key, fixture)),
          ...(await checkApiTicket(page, output, key, fixture)),
          ...(await checkApiLegacy(page, base, output, key, fixture)),
        );
        assert.deepEqual(errors, []);
        console.log(
          "Mock API events catalog/RSVP/save/ticket/calendar/errors/legacy",
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
        sameOriginPort4000: true,
        ssrCookieAllowlist: true,
        singleFlightIdempotentRsvp: true,
        noLocalApiRegistrationOrCountInflation: true,
        publisherTicketOnly: true,
        stoppedWaitDoesNotPromiseRollback: true,
        noDemoFallback: true,
      },
      null,
      2,
    ),
  );
} finally {
  fixture.releaseMutationResponses();
  await browser.close();
  fixture.server.closeAllConnections();
  await new Promise((resolve) => fixture.server.close(resolve));
}
