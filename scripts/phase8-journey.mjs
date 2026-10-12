import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser, restrictToApp } from "./audit/browser.mjs";
import {
  capture,
  visit,
  stored,
  trackErrors,
  focusIs,
} from "./phase6/events/helpers.mjs";
import { studyWorkflows } from "./phase6/study/workflows.mjs";
import { socialWorkflows } from "./phase6/social/workflows.mjs";
import { engagementJourney } from "./phase8/journey-engagement.mjs";
import { campusJourney } from "./phase8/journey-campus.mjs";
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3001",
  out = process.env.AUDIT_OUTPUT_DIR ?? ".cache/final/journey";
await mkdir(out, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true }),
  context = await browser.newContext({
    viewport: { width: 360, height: 900 },
    reducedMotion: "reduce",
    colorScheme: "light",
  }),
  captures = [],
  observations = {};
await restrictToApp(context, base);
const page = await context.newPage(),
  errors = trackErrors(page);
try {
  await page.goto(base + "/home", { waitUntil: "networkidle" });
  await page.waitForURL((u) => u.pathname === "/onboarding");
  observations.firstVisitDestination = "/onboarding";
  for (let n = 0; n < 3; n++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  captures.push(await capture(page, out, "journey-onboarding"));
  await page
    .getByRole("button", { name: "Skip introduction", exact: true })
    .click();
  await page.waitForURL((u) => u.pathname === "/home");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(new URL(page.url()).pathname, "/home");
  observations.onboardingPersists = true;
  const more = page.getByRole("button", { name: "More", exact: true });
  await more.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  assert.equal(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
    true,
  );
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  await focusIs(page, more);
  observations.menuFocusAndReturn = true;
  await studyWorkflows(page, base, out, "journey", captures);
  observations.taskCRUDAndConstraintsAndICS = true;
  await engagementJourney(page, base, out, captures);
  observations.RSVPAndCancelAndExecutiveApprovalPersist = true;
  await campusJourney(page, base, out, captures);
  observations.canonicalSaveAndSRCAndRequiredReportPhotoPersist = true;
  await socialWorkflows(page, base, out, "journey", captures);
  observations.photoPostAndRepliesAndPrivateThreadsAndReadStatePersist = true;
  await visit(page, base, "/settings");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL((u) => u.pathname === "/sign-in");
  const auth = await page.evaluate(
      () => JSON.parse(localStorage.getItem("campusone-auth")).state,
    ),
    app = await stored(page, "campusone-app");
  assert.equal(auth.user, null);
  assert.equal(auth.role, "student");
  for (const key of [
    "tasks",
    "bookmarks",
    "memberships",
    "registrations",
    "notifications",
    "srcRequests",
  ])
    assert.deepEqual(app[key], [], key);
  assert.deepEqual(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((k) =>
        k.startsWith("campusone-workspace:"),
      ),
    ),
    [],
  );
  observations.signOutClearedPrivateActivityAndWorkspace = true;
  assert.deepEqual(errors, []);
  await writeFile(
    out + "/interactions.json",
    JSON.stringify(
      {
        observations,
        captures,
        pageExceptions: errors,
        realBackendVerified: false,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify(observations, null, 2));
  console.log(
    "Current cross-feature journey passed:",
    captures.length,
    "AA/layout captures",
  );
} finally {
  await browser.close();
}
