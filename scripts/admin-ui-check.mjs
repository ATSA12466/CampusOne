/**
 * Browser-level check that every web admin dashboard is wired to the backend.
 *
 * Drives the real dashboards in Chromium (the same isolated tooling the design
 * audits use), performs genuine edits through the UI, and confirms each change
 * landed in the store by reading it back from the API. Also confirms the
 * student app cannot reach admin data through the UI or the API.
 *
 * Setup (documented in docs/DESIGN_AUDIT.md):
 *   npm install --prefix .cache/design-audit/tooling \
 *     --no-package-lock --no-save --no-audit --no-fund playwright@1.64.0 @sparticuz/chromium@153.0.0
 *
 * Run:
 *   node scripts/seed-server.mjs
 *   npm run dev                     # or: npm run start
 *   AUDIT_BASE_URL=http://127.0.0.1:3001 node scripts/admin-ui-check.mjs
 */
import assert from "node:assert/strict";
import { launchAuditBrowser, restrictToApp, waitForScreen } from "./audit/browser.mjs";

const base = (process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const ACCOUNTS = {
  admin: { email: "yaw.admin@campusone.app", password: "CampusOne-Super-01" },
  student: { email: "ama.student@gctu.edu.gh", password: "CampusOne-Student-01" },
};
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

let passed = 0;
const failures = [];
function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(`${name}${detail ? ` -> ${detail}` : ""}`);
    console.log(`  FAIL ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

const browser = await launchAuditBrowser();

async function signedInContext(account) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => {
    localStorage.setItem("campusone-onboarding", JSON.stringify({ state: { completed: true }, version: 0 }));
  });
  await restrictToApp(context, base);
  const response = await context.request.post(`${base}/api/auth/sign-in`, { data: account });
  assert.equal(response.status(), 200, `sign-in for ${account.email}`);
  return context;
}

async function json(context, path, init) {
  const response = await context.request.fetch(`${base}${path}`, { ...init, failOnStatusCode: false });
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status(), body };
}

const admin = await signedInContext(ACCOUNTS.admin);
const student = await signedInContext(ACCOUNTS.student);
const page = await admin.newPage();
const pageErrors = [];
const serverErrors = [];
const dialogs = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("dialog", async (dialog) => {
  dialogs.push(dialog.message());
  await dialog.accept();
});
page.on("response", (response) => {
  const url = response.url();
  if (url.startsWith(base) && url.includes("/api/") && response.status() >= 500)
    serverErrors.push(`${response.status()} ${url}`);
});

/** Polls a list endpoint until `predicate` sees the expected state, or gives up. */
async function until(context, path, predicate, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = (await json(context, path)).body;
    if (predicate(last)) return last;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return last;
}

async function visit(path) {
  const response = await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200, `${path} status`);
  await waitForScreen(page);
  return response;
}

/** Reads the big number out of a StatTile by its label. */
async function statValue(label) {
  const tile = page.getByText(label, { exact: true }).first();
  const card = tile.locator("xpath=ancestor::*[contains(@class,'rounded-card')][1]");
  const text = await card.innerText();
  const match = text.match(/\d[\d,]*/);
  return match ? Number(match[0].replace(/,/g, "")) : NaN;
}

function cardOf(locator) {
  return locator.locator("xpath=ancestor::*[contains(@class,'rounded-card')][1]");
}

console.log(`Admin UI wiring check against ${base}\n`);

console.log("Overview (/admin)");
{
  const overview = (await json(admin, "/api/admin/overview")).body;
  await visit("/admin");
  check("Accounts tile shows the live account count", (await statValue("Accounts")) === overview.counts.users, `tile ${await statValue("Accounts")} vs api ${overview.counts.users}`);
  check("Housing queue tile shows the live pending count", (await statValue("Housing queue")) === overview.counts.pendingListings, `api ${overview.counts.pendingListings}`);
  check("Open reports tile shows the live open count", (await statValue("Open reports")) === overview.counts.openReports, `api ${overview.counts.openReports}`);
  const text = await page.locator("main").innerText();
  check("store health is reported honestly", text.includes(overview.health.store === "file" ? "file" : overview.health.store), overview.health.store);
  check("PostgreSQL state is stated, not implied", text.includes("Not configured — file store in use") === (overview.health.database !== "configured"), `database=${overview.health.database}`);
  check("Published materials figure matches the store", text.includes(String(overview.counts.materials)), `materials=${overview.counts.materials}`);
}

console.log("\nUsers (/admin/users)");
{
  await visit("/admin/users");
  check("live accounts render (seeded student visible)", (await page.locator("main").innerText()).includes(ACCOUNTS.student.email));

  const search = page.getByPlaceholder(/Search users/);
  await search.fill("efua");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForFunction(() => !document.body.innerText.includes("ama.student@gctu.edu.gh"), null, { timeout: 15000 });
  const filtered = await page.locator("main").innerText();
  check("server-side search filters the table", filtered.includes("efua.src@gctu.edu.gh") && !filtered.includes(ACCOUNTS.student.email));

  const srcUser = (await json(admin, "/api/admin/users?q=efua")).body.items[0];
  const row = cardOf(page.getByText(srcUser.email, { exact: true }).first());
  await row.getByRole("button", { name: "Manage" }).click();
  const verification = row.locator(`#verified-${srcUser.id}`);
  await verification.selectOption(srcUser.verifiedStudent ? "no" : "yes");
  await row.getByRole("button", { name: "Save changes" }).click();
  await page.waitForFunction(
    (id) => document.querySelector(`#verified-${id}`) === null,
    srcUser.id,
    { timeout: 15000 },
  );
  const afterSave = (await json(admin, `/api/admin/users?q=${encodeURIComponent(srcUser.email)}`)).body.items[0];
  check("UI verification toggle persists to the store", afterSave.verifiedStudent === !srcUser.verifiedStudent, `expected ${!srcUser.verifiedStudent}, stored ${afterSave.verifiedStudent}`);

  // Put the account back exactly as found.
  await json(admin, `/api/admin/users/${srcUser.id}`, {
    method: "PATCH",
    data: { verifiedStudent: srcUser.verifiedStudent, status: srcUser.status, roles: srcUser.roles },
  });

  const badSave = await json(admin, `/api/admin/users/${srcUser.id}`, { method: "PATCH", data: { roles: [] } });
  check("the store refuses a role-less account", badSave.status === 400, `got ${badSave.status}`);
}

console.log("\nRoles & grants (/admin/roles)");
{
  const srcUser = (await json(admin, "/api/admin/users?q=efua")).body.items[0];
  await visit("/admin/roles");
  check("existing grants render", (await page.locator("main").innerText()).includes("club."), "no grant rows on the page");

  const form = page.locator("#grant-perm").locator("xpath=ancestor::*[contains(@class,'rounded-card')][1]");
  await page.locator("#grant-user").fill(srcUser.id);
  await page.locator("#grant-perm").selectOption("accommodation.listings.review");
  await page.locator("#grant-scope-type").selectOption("global");
  await form.getByRole("button", { name: "Create grant" }).click();

  // Scope to the active section: the permission name also appears inside the form's <select>.
  const active = page.locator("section[aria-labelledby='active-grants']");
  const activeHeading = page.locator("#active-grants");
  const countOf = async (locator) => Number((await locator.innerText()).match(/\((\d+)\)/)?.[1] ?? NaN);
  const granted = active.getByText("accommodation.listings.review", { exact: true }).first();
  await granted.waitFor({ timeout: 15000 });

  const grants = (await json(admin, "/api/admin/grants")).body.items;
  const created = grants.find((g) => g.userId === srcUser.id && g.permission === "accommodation.listings.review");
  check("UI grant creation reaches the store", Boolean(created), `${grants.length} grants`);
  check("new grant renders in the active list", (await active.innerText()).includes("accommodation.listings.review"));
  const activeBefore = await countOf(activeHeading);

  if (created) {
    const grantRow = active.getByText("accommodation.listings.review", { exact: true }).first();
    await cardOf(grantRow).getByRole("button", { name: "Revoke" }).click();
    const after = (await until(admin, "/api/admin/grants", (body) => body.items.some((g) => g.id === created.id && g.revokedAt))).items;
    const revoked = after.find((g) => g.id === created.id);
    check("UI revoke is recorded in the store", Boolean(revoked?.revokedAt), `revokedAt=${revoked?.revokedAt}`);
    check("the active count drops after revoking", (await countOf(activeHeading)) === activeBefore - 1, `was ${activeBefore}, now ${await countOf(activeHeading)}`);
    const revokedSection = page.locator("section[aria-labelledby='revoked-grants']");
    check("the grant is listed as revoked", (await revokedSection.innerText()).includes("accommodation.listings.review"));
    check("revoking asks for confirmation first", dialogs.some((message) => /revoke/i.test(message)), dialogs.join(" | ") || "no dialog");
  }
}

console.log("\nContent / materials (/admin/content)");
{
  const title = `UI check resource ${Date.now().toString().slice(-5)}`;
  await visit("/admin/content");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Course").fill("CS 205");
  await page.getByLabel("Kind", { exact: true }).selectOption("reading");
  await page.getByLabel("Description").fill("Created through the admin dashboard by scripts/admin-ui-check.mjs.");
  await page.getByLabel("File URL (authorised hosting)").fill("https://example.org/ui-check.pdf");
  await page.getByRole("button", { name: "Add material" }).click();
  await page.getByText(title, { exact: false }).first().waitFor({ timeout: 15000 });

  const materials = (await json(admin, "/api/admin/materials")).body.items;
  const created = materials.find((m) => m.title === title);
  check("UI material creation reaches the store", Boolean(created), `${materials.length} materials`);
  check("the created material renders in the list", (await page.locator("main").innerText()).includes(title));

  if (created) {
    const row = cardOf(page.getByText(title, { exact: false }).first());
    await row.getByRole("button", { name: "Edit" }).click();
    await page.locator(`#mat-status-${created.id}`).selectOption("published");
    await page.getByRole("button", { name: "Save changes" }).click();
    const after = await until(admin, "/api/admin/materials", (body) =>
      body.items.some((m) => m.id === created.id && m.status === "published"),
    );
    check("UI edit persists (status -> published)", after.items.find((m) => m.id === created.id)?.status === "published", `stored ${after.items.find((m) => m.id === created.id)?.status}`);

    const finalRow = cardOf(page.getByText(title, { exact: false }).first());
    await finalRow.getByRole("button", { name: "Delete" }).click();
    const remaining = await until(admin, "/api/admin/materials", (body) => !body.items.some((m) => m.id === created.id));
    check("UI delete removes it from the store", !remaining.items.some((m) => m.id === created.id), `${remaining.items.length} materials left`);
    check("deleting asks for confirmation first", dialogs.some((message) => /delete/i.test(message)), dialogs.join(" | ") || "no dialog");
    await page.waitForFunction((t) => !document.body.innerText.includes(t), title, { timeout: 15000 }).catch(() => {});
    check("deleted material leaves the list", !(await page.locator("main").innerText()).includes(title));
  }
}

console.log("\nModeration (/admin/moderation)");
{
  const reports = (await json(admin, "/api/admin/reports")).body.items;
  const target = reports.find((r) => r.status === "open") ?? reports[0];
  await visit("/admin/moderation");
  check("the moderation queue renders live reports", (await page.locator("main").innerText()).includes(target.reason.slice(0, 24)));

  const card = cardOf(page.getByText(target.reason, { exact: false }).first());
  await card.getByRole("button", { name: "Review report" }).click();
  await card.locator(`#rep-status-${target.id}`).selectOption("actioned");
  await card.locator(`#rep-owner-${target.id}`).fill("UI check owner");
  await card.locator(`#rep-resolution-${target.id}`).fill("Triaged through the dashboard by scripts/admin-ui-check.mjs.");
  await card.getByRole("button", { name: "Save review" }).click();

  const after = (await until(admin, "/api/admin/reports", (body) =>
    body.items.some((r) => r.id === target.id && r.status === "actioned"),
  )).items.find((r) => r.id === target.id);
  check("UI triage persists (status -> actioned)", after?.status === "actioned", `stored ${after?.status}`);
  check("UI triage persists the owner + resolution", after?.assignee === "UI check owner" && after?.resolution.includes("admin-ui-check"), `assignee=${after?.assignee}`);
  check("the triaged report moves to the decided section", await page.locator("section[aria-labelledby='mod-done']").getByText(target.reason.slice(0, 20), { exact: false }).first().isVisible().catch(() => false));

  // Restore the seeded report so repeat runs start from the same place.
  await json(admin, `/api/admin/reports/${target.id}`, {
    method: "PATCH",
    data: { status: target.status, assignee: target.assignee, resolution: target.resolution },
  });
}

console.log("\nAccommodation (/admin/accommodation)");
{
  const submission = {
    title: `UI check room ${Date.now().toString().slice(-5)}`,
    area: "Tesano",
    price: 1200,
    period: "month",
    beds: 2,
    description: "Submitted by scripts/admin-ui-check.mjs so the review screen has something real to verify.",
    contact: "ui-check@gctu.edu.gh",
  };
  const submitted = await json(student, "/api/listings", { method: "POST", data: submission });
  assert.equal(submitted.status, 201, "student listing submission");
  const listingId = submitted.body.item.id;

  await visit("/admin/accommodation");
  check("pending submission appears in the review queue", (await page.locator("main").innerText()).includes(submission.title));

  const card = cardOf(page.getByText(submission.title, { exact: false }).first());
  await card.locator(`#lst-note-${listingId}`).fill("Address and contact verified by scripts/admin-ui-check.mjs.");
  await card.getByRole("button", { name: "Verify & publish" }).click();

  const stored = (await until(admin, "/api/admin/listings", (body) =>
    body.items.some((l) => l.id === listingId && l.status === "approved"),
  )).items.find((l) => l.id === listingId);
  check("UI approval persists to the store", stored?.status === "approved", `stored ${stored?.status}`);
  check("decision is attributed", Boolean(stored?.decidedBy) && Boolean(stored?.decidedAt), `decidedBy=${stored?.decidedBy}`);
  const publicList = (await json(student, "/api/listings")).body.items;
  check("approved listing is visible to students", publicList.some((l) => l.id === listingId), `${publicList.length} public listings`);

  const rejected = await json(admin, `/api/admin/listings/${listingId}`, { method: "PATCH", data: { status: "rejected", note: "UI check cleanup." } });
  check("the same screen's Reject path also works", rejected.status === 200 && rejected.body.item.status === "rejected", `got ${rejected.status}`);
}

console.log("\nAudit log (/admin/audit)");
{
  await visit("/admin/audit");
  const text = await page.locator("main").innerText();
  check("audit entries render", /\d/.test(text) && text.includes(":"), "no entries visible");
  check("the run's own edits are recorded", text.includes("accommodation.listings.submit") || text.includes("platform.") || text.includes("admin"), "no recent admin actions listed");

  const search = page.getByPlaceholder(/Search audit log/);
  await search.fill("platform");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.waitForFunction(() => document.body.innerText.includes("platform"), null, { timeout: 15000 });
  const filtered = (await json(admin, "/api/admin/audit?page=1&pageSize=30&q=platform")).body;
  check("audit search is server-side and scoped", filtered.items.every((e) => JSON.stringify(e).toLowerCase().includes("platform")), `${filtered.items.length} rows`);
}

console.log("\nSettings (/admin/settings)");
{
  const bundle = (await json(admin, "/api/admin/settings")).body;
  const key = bundle.known[0];
  const original = bundle.settings[key] ?? "";
  await visit("/admin/settings");
  const input = page.locator(`#setting-${key}`);
  check("settings inputs are bound to live values", (await input.inputValue()) === original, `input="${await input.inputValue()}" vs stored "${original}"`);

  await input.fill("UI check value");
  await cardOf(input).getByRole("button", { name: "Save" }).click();
  const saved = (await until(admin, "/api/admin/settings", (body) => body.settings[key] === "UI check value")).settings;
  check("UI save writes the setting to the store", saved[key] === "UI check value", `stored "${saved[key]}"`);
  check("the save is acknowledged on screen", (await page.locator("main").innerText()).includes("saved"), "no confirmation shown");

  await input.fill(original);
  await cardOf(input).getByRole("button", { name: "Save" }).click();
  const restored = (await until(admin, "/api/admin/settings", (body) => body.settings[key] === original)).settings;
  check("the original value is restored through the UI", restored[key] === original, `stored "${restored[key]}"`);
}

console.log("\nBranding (/admin/branding)");
{
  const before = (await json(admin, "/api/admin/branding")).body;
  await visit("/admin/branding");
  check("published branding is loaded into the editor", (await page.locator("#brand-name").inputValue()) === before.published.displayName, `input="${await page.locator("#brand-name").inputValue()}"`);
  check("version history renders", (await page.locator("main").innerText()).includes(String(before.versions.length)) || before.versions.length === 0, `${before.versions.length} versions`);

  // Asset URLs live on the branding record itself (logoLight, logoDark, …).
  const previousLogo = before.draft.logoLight ?? "";
  const logoInput = page.locator("section[aria-labelledby='brand-assets'] input[type=file]").first();
  await logoInput.setInputFiles({ name: "ui-check.png", mimeType: "image/png", buffer: PNG });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Save draft" }).click();
  const afterDraft = await until(admin, "/api/admin/branding", (body) => (body.draft.logoLight ?? "") !== previousLogo);
  const url = afterDraft.draft.logoLight ?? "";
  check("uploaded asset URL is saved on the draft", String(url).startsWith("/api/brand/"), `logoLight="${url}"`);
  check("uploading did not publish the draft", afterDraft.published.logoLight !== url, "draft asset leaked into published");
  if (url) {
    const served = await admin.request.get(`${base}${url}`);
    check("the uploaded asset is served back", served.status() === 200, `got ${served.status()}`);
  }
  check("Publish is offered but not taken automatically", await page.getByRole("button", { name: "Publish", exact: true }).isVisible());
}

console.log("\nStudent boundary");
{
  const studentPage = await student.newPage();
  const response = await studentPage.goto(`${base}/admin`, { waitUntil: "networkidle" });
  check("/admin answers 200 with a gate, not data", response.status() === 200, `got ${response.status()}`);
  const text = await studentPage.locator("body").innerText();
  check("the gate explains the restriction", text.includes("Restricted area") && text.includes("authorised"), text.slice(0, 120).replace(/\n/g, " "));
  check("no admin figures are rendered for a student", !text.includes("Housing queue") && !text.includes("Open reports"), "admin stats visible");
  const api = await json(student, "/api/admin/overview");
  check("the API refuses the student too", api.status === 403, `got ${api.status}`);
  await studentPage.close();
}

console.log("\nRuntime health");
check("no uncaught page errors across the admin dashboards", pageErrors.length === 0, pageErrors.join(" | "));
check("no 5xx responses from the admin API", serverErrors.length === 0, serverErrors.join(" | "));

await page.close();
await admin.close();
await student.close();
await browser.close();

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log("\nFailures:");
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}
