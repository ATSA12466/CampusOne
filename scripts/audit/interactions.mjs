import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { AxeBuilder, launchAuditBrowser, restrictToApp, waitForScreen } from "./browser.mjs";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3000";
const output = resolve(process.env.AUDIT_OUTPUT_DIR ?? ".cache/design-audit/results");
await mkdir(output, { recursive: true });
const browser = await launchAuditBrowser();
const context = await browser.newContext({ viewport: { width: 360, height: 900 }, reducedMotion: "reduce" });
await restrictToApp(context, baseUrl);
const page = await context.newPage();
const errors = [];
const observations = {};
page.on("pageerror", (error) => errors.push(error.message));
const visit = async (path) => { await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" }); await waitForScreen(page); };
const cardWithHeading = (name) => page.locator("section").filter({ has: page.getByRole("heading", { name, exact: true }) });
const screenshot = (name) => page.screenshot({ path: join(output, `interaction-${name}.png`), fullPage: true, animations: "disabled" });

try {
  await visit("/home");
  observations.firstVisitDestination = new URL(page.url()).pathname;
  // Record the baseline guard behavior, then exercise onboarding explicitly.
  if (observations.firstVisitDestination !== "/onboarding") await visit("/onboarding");
  for (let index = 0; index < 3; index++) await page.getByRole("button", { name: "Continue", exact: true }).click();
  await screenshot("onboarding-representation");
  observations.onboardingRepresentationAxe = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations.map(({ id, nodes }) => ({ id, nodes: nodes.length }));
  await page.getByRole("button", { name: "Skip introduction", exact: true }).click();
  await page.waitForURL("**/home");
  await page.reload({ waitUntil: "networkidle" });
  observations.onboardingPersists = new URL(page.url()).pathname === "/home";

  await page.getByRole("button", { name: "More", exact: true }).click();
  const dialog = page.getByRole("dialog");
  observations.menuFocusInside = await dialog.evaluate((element) => element.contains(document.activeElement));
  observations.menuAccessibleName = await dialog.getAttribute("aria-label") ?? await dialog.getAttribute("aria-labelledby");
  await screenshot("mobile-menu");
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  observations.menuStillOpenAfterEscape = false;
  observations.menuReturnsFocus = await page.getByRole("button", { name: "More", exact: true }).evaluate((element) => document.activeElement === element);

  await visit("/tasks");
  const title = "Audit: revise Database Systems";
  await page.locator('input[name="title"]').fill(title);
  await page.locator('input[name="dueDate"]').fill("2026-10-20");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await cardWithHeading(title).getByRole("button", { name: "Complete", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await cardWithHeading(title).getByText("Completed", { exact: true }).count(), 1);
  observations.taskCreateCompletePersists = true;
  await cardWithHeading(title).getByRole("button", { name: "Edit", exact: true }).click();
  await page.locator('input[name="title"]').fill(`${title} edited`);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await cardWithHeading(`${title} edited`).getByRole("button", { name: "Delete", exact: true }).click();
  observations.taskEditDeleteWorks = await page.getByRole("heading", { name: `${title} edited`, exact: true }).count() === 0;

  await visit("/events");
  await page.getByRole("button", { name: "Register", exact: true }).first().click();
  await screenshot("event-ticket");
  await page.reload({ waitUntil: "networkidle" });
  observations.eventTicketPersists = await page.getByRole("heading", { name: "Demo QR ticket preview", exact: true }).isVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).first().click();
  observations.eventCancellationWorks = await page.getByRole("heading", { name: "Demo QR ticket preview", exact: true }).count() === 0;

  await visit("/clubs");
  observations.defaultJoinButtonCount = await page.getByRole("button", { name: "Request to join", exact: true }).count();
  await page.evaluate(() => { const state = JSON.parse(localStorage.getItem("campusone-app")); state.state.memberships = []; localStorage.setItem("campusone-app", JSON.stringify(state)); });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Request to join", exact: true }).first().click();
  await visit("/sign-in");
  await page.locator('select[name="role"]').selectOption("club-executive");
  await page.getByRole("button", { name: "Sign in (demo)", exact: true }).click();
  await page.waitForURL("**/home");
  await visit("/clubs");
  await page.getByRole("button", { name: "Approve", exact: true }).first().click();
  await page.reload({ waitUntil: "networkidle" });
  observations.clubRequestApprovalPersists = await page.getByText("Membership: approved", { exact: true }).count() === 1;

  await visit("/opportunities");
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await page.reload({ waitUntil: "networkidle" });
  observations.bookmarkPersists = await page.getByRole("button", { name: "Unsave", exact: true }).count() === 1;
  await visit("/notifications");
  await page.getByRole("button", { name: "Mark as read", exact: true }).first().click();
  await page.reload({ waitUntil: "networkidle" });
  observations.notificationReadPersists = await page.getByText("Read", { exact: true }).count() === 1;

  await visit("/src-office");
  await page.getByRole("button", { name: "Submit request", exact: true }).click();
  observations.srcValidationWorks = await page.getByText("Request title is required", { exact: true }).isVisible();
  await page.locator('input[name="title"]').fill("Audit: weekend study space");
  await page.locator('textarea[name="description"]').fill("Please provide a supervised weekend study space for revision.");
  await page.getByRole("button", { name: "Submit request", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  observations.srcSubmissionPersists = await page.getByText("Audit: weekend study space", { exact: true }).isVisible();

  await visit("/community");
  await page.locator("textarea").fill("Audit: Sunday revision group");
  await page.getByRole("button", { name: "Post update", exact: true }).click();
  observations.communityPostAppears = await page.getByText("Audit: Sunday revision group", { exact: true }).isVisible();
  await page.reload({ waitUntil: "networkidle" });
  observations.communityPostPersists = await page.getByText("Audit: Sunday revision group", { exact: true }).count() > 0;
  await visit("/lost-and-found");
  observations.reportHasPhotoInput = await page.locator('input[type="file"]').count() > 0;
  await page.getByPlaceholder("Item name", { exact: true }).fill("Audit: blue notebook");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  observations.reportAppears = await page.getByText("Audit: blue notebook", { exact: true }).isVisible();
  await page.reload({ waitUntil: "networkidle" });
  observations.reportPersists = await page.getByText("Audit: blue notebook", { exact: true }).count() > 0;

  await visit("/study-assistant");
  await page.locator("input").fill("Database Systems");
  await page.locator("select").selectOption({ label: "90 minutes" });
  await page.getByPlaceholder("Available days, existing commitments, break preferences...", { exact: true }).fill("Sundays only");
  await page.getByRole("button", { name: "Generate demo study plan", exact: true }).click();
  const plan = await page.locator("textarea[readonly]").inputValue();
  observations.studyPlanUsesSubject = plan.includes("Database Systems");
  observations.studyPlanUsesConstraints = plan.includes("Sunday");
  await visit("/settings");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL("**/sign-in");
  observations.signOutState = await page.evaluate(() => { const auth = JSON.parse(localStorage.getItem("campusone-auth")); const app = JSON.parse(localStorage.getItem("campusone-app")); return { user: auth.state.user, role: auth.state.role, bookmarks: app.state.bookmarks.length }; });
  assert.deepEqual(errors, []);
  observations.pageExceptions = errors;
  await writeFile(join(output, "interactions.json"), JSON.stringify(observations, null, 2));
  console.log(JSON.stringify(observations, null, 2));
} finally {
  await browser.close();
}
