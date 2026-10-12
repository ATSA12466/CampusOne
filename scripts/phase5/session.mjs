import assert from "node:assert/strict";
import { authContext, stored, noSecrets, visit } from "./helpers.mjs";
async function activityEmpty(page) {
  const state = await stored(page, "campusone-app");
  for (const key of [
    "tasks",
    "bookmarks",
    "memberships",
    "registrations",
    "notifications",
    "srcRequests",
  ])
    assert.deepEqual(state[key], [], `Clear ${key}`);
}
export async function checkSession(browser, base) {
  const context = await authContext(browser, base, 1280),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await visit(page, base, "/academics/resources/r1");
    await page
      .getByRole("button", { name: "Save for later", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Remove from saved", exact: true })
      .waitFor();
    assert.equal((await stored(page, "campusone-app")).bookmarks.length, 1);
    await visit(page, base, "/clubs");
    const request = (await stored(page, "campusone-app")).memberships.find(
      (item) => item.clubId === "club-2" && item.userId === "user-1",
    );
    assert.equal(request.status, "pending");
    await visit(page, base, "/sign-in?next=/clubs");
    await page
      .getByLabel("Role (demo switch)", { exact: true })
      .selectOption("club-executive");
    await page
      .getByRole("button", { name: "Sign in (demo)", exact: true })
      .click();
    await page.waitForURL((url) => url.pathname === "/clubs");
    const panel = page.locator("#executive-reviews");
    await panel
      .getByRole("heading", { name: "Club executive demo panel", exact: true })
      .waitFor();
    await panel
      .getByRole("button", { name: "Approve", exact: true })
      .last()
      .click();
    await panel
      .getByRole("group", {
        name: "Membership request for Debate Assembly",
        exact: true,
      })
      .waitFor({ state: "hidden" });
    assert.equal(
      (await stored(page, "campusone-app")).memberships.find(
        (item) => item.id === request.id,
      ).status,
      "approved",
    );
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      (await stored(page, "campusone-app")).memberships.find(
        (item) => item.id === request.id,
      ).status,
      "approved",
    );
    const second = await context.newPage();
    await visit(second, base, "/management");
    await second.getByText("Membership reviews", { exact: true }).waitFor();
    await visit(page, base, "/settings");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/sign-in");
    await second
      .getByRole("heading", {
        name: "Sign in to see your workspace",
        exact: true,
      })
      .waitFor();
    assert.equal(
      await second.getByText("Membership reviews", { exact: true }).count(),
      0,
    );
    let state = await stored(page);
    assert.equal(state.user, null);
    assert.equal(state.role, "student");
    await activityEmpty(page);
    assert.equal(
      (await stored(page, "campusone-onboarding")).preferences.name,
      "",
    );
    await visit(page, base, "/home");
    await page
      .getByRole("link", { name: "Open guest profile", exact: true })
      .waitFor();
    await page.reload({ waitUntil: "networkidle" });
    await page
      .getByRole("link", { name: "Open guest profile", exact: true })
      .waitFor();
    await activityEmpty(page);
    await visit(page, base, "/sign-in");
    await page
      .getByRole("checkbox", {
        name: "Remember this demo profile on this device",
      })
      .uncheck();
    await page
      .getByLabel("Role (demo switch)", { exact: true })
      .selectOption("club-executive");
    await page
      .getByRole("button", { name: "Sign in (demo)", exact: true })
      .click();
    await page.waitForURL((url) => url.pathname === "/home");
    state = await stored(page);
    assert.equal(state.user, null);
    assert.equal(state.role, "student");
    assert.equal(state.remember, false);
    // Visit-only sessions survive SPA navigation, not a new document.
    // A page.goto here correctly becomes guest and must not allow a save.
    await page.locator('a[href="/academics"]').first().click();
    await page.waitForURL((url) => url.pathname === "/academics");
    await page.locator('a[href="/academics/resources/r1"]').first().click();
    await page.waitForURL((url) => url.pathname === "/academics/resources/r1");
    await page
      .getByRole("button", { name: "Save for later", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Remove from saved", exact: true })
      .waitFor();
    assert.equal((await stored(page, "campusone-app")).bookmarks.length, 1);
    await page.reload({ waitUntil: "networkidle" });
    await page
      .getByRole("link", { name: "Open guest profile", exact: true })
      .waitFor();
    await activityEmpty(page);
    await visit(page, base, "/sign-in?next=/management");
    await page
      .getByRole("checkbox", {
        name: "Remember this demo profile on this device",
      })
      .check();
    await page
      .getByLabel("Role (demo switch)", { exact: true })
      .selectOption("club-executive");
    await page
      .getByRole("button", { name: "Sign in (demo)", exact: true })
      .click();
    await page.waitForURL((url) => url.pathname === "/management");
    await second.getByText("Membership reviews", { exact: true }).waitFor();
    await page.evaluate(() => localStorage.clear());
    await second
      .getByRole("heading", {
        name: "Sign in to see your workspace",
        exact: true,
      })
      .waitFor();
    await activityEmpty(second);
    assert.equal((await stored(second)).user, null);
    await noSecrets(page, ["campusone-demo", "blob:"]);
    assert.deepEqual(errors, []);
    return {
      executiveRoleSwitchPreservedRequest: true,
      approvalPersistedAfterReload: true,
      signOutClearedRoleAndSixCollections: true,
      signOutAcrossDemoTabs: true,
      signedOutSurvivedReload: true,
      rememberFalseNotPersisted: true,
      rememberFalseClearedActivityOnReload: true,
      externalStorageClearSignedOutOtherDemoTab: true,
      pageExceptions: errors,
    };
  } finally {
    await context.close();
  }
}
