import "./foundation/load-typescript.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
import { authContext, trackErrors } from "./phase6/discover/helpers.mjs";
const { startDiscoverFixture } = await import(
  "./phase6/discover/api-fixture.mjs"
);
import { checkApiCatalog } from "./phase6/discover/api-catalog.mjs";
import { checkApiSaves } from "./phase6/discover/api-saves.mjs";
import { checkApiStates } from "./phase6/discover/api-states.mjs";
const base = process.env.AUDIT_API_BASE_URL ?? "http://127.0.0.1:3002",
  output = process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase6/discover/api-browser";
await mkdir(output, { recursive: true });
const fixture = await startDiscoverFixture(),
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
        { name: "other_private", value: "not-allowed-on-ssr", url: base },
      ]);
      try {
        captures.push(
          ...(await checkApiCatalog(page, base, output, key, fixture)),
          ...(await checkApiSaves(page, base, output, key, fixture)),
          ...(await checkApiStates(page, base, output, key, fixture)),
        );
        assert.deepEqual(errors, []);
        console.log(
          "Mock Discover sources/load-more/saves/shared domains/errors/legacy/cookies",
          width,
          theme,
          "passed",
        );
      } finally {
        fixture.releaseWrites();
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
        publisherOnlySaves: true,
        noLocalApiBookmarks: true,
        sharedClubEventSaveContract: true,
        singleFlightAndRollback: true,
        noDemoFallback: true,
      },
      null,
      2,
    ),
  );
} finally {
  fixture.releaseWrites();
  await browser.close();
  fixture.server.closeAllConnections();
  await new Promise((resolve) => fixture.server.close(resolve));
}
