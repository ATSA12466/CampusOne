import assert from "node:assert/strict";
import { authContext, capture, completeSignup, stored, visit, noSecrets } from "./helpers.mjs";
export async function checkStates(browser, dev, production, output) {
  const result = { fixtures: [], captures: [] };
  for (const route of ["sign-in", "register", "forgot-password"]) {
    const context = await authContext(browser, dev),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await visit(page, dev, `/${route}?auth-preview=error`);
      const before = await stored(page);
      if (route === "register") await completeSignup(page);
      else if (route === "forgot-password")
        await page.getByLabel(/^Email/).fill("esi@campusone.demo");
      const submit = page.locator('button[type="submit"]');
      await submit.click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Controlled demo preview failure" })
        .waitFor();
      assert.deepEqual(await stored(page), before);
      result.captures.push(await capture(page, output, `360-light-${route}-service-error`));
      await submit.click();
      if (route === "forgot-password")
        await page.getByRole("heading", { name: "Preview complete. No email was sent." }).waitFor();
      else
        await page.waitForURL(
          (url) => url.pathname === (route === "register" ? "/onboarding" : "/home"),
        );
      assert.deepEqual(errors, []);
      result.fixtures.push({
        route,
        controlledError: true,
        retainedInputs: true,
        resubmitRecovered: true,
      });
    } finally {
      await context.close();
    }
  }
  const slow = await authContext(browser, dev),
    page = await slow.newPage();
  try {
    await visit(page, dev, "/sign-in?auth-preview=slow");
    const before = await stored(page);
    await page.getByRole("button", { name: "Sign in (demo)", exact: true }).click();
    await page.getByRole("button", { name: "Cancel request", exact: true }).waitFor();
    assert.equal(await page.locator('button[type="submit"]').isDisabled(), true);
    result.captures.push(await capture(page, output, "360-light-signin-pending"));
    await page.getByRole("button", { name: "Cancel request", exact: true }).click();
    assert.equal(new URL(page.url()).pathname, "/sign-in");
    assert.equal(
      await page.getByRole("button", { name: "Sign in (demo)", exact: true }).isEnabled(),
      true,
    );
    assert.deepEqual(await stored(page), before);
    result.cancelPendingWithoutSessionChange = true;
  } finally {
    await slow.close();
  }
  const privateContext = await authContext(browser, production, 360, "dark", false),
    privatePage = await privateContext.newPage(),
    privateErrors = [];
  privatePage.on("pageerror", (error) => privateErrors.push(error.message));
  await privateContext.addInitScript(() => {
    for (const method of ["getItem", "setItem", "removeItem"])
      Object.defineProperty(Storage.prototype, method, {
        value() {
          throw new Error("controlled storage denial");
        },
      });
  });
  try {
    await privatePage.goto(`${production}/home`, { waitUntil: "networkidle" });
    await privatePage.waitForURL((url) => url.pathname === "/onboarding");
    await privatePage.getByText(/Device storage is unavailable/).waitFor();
    result.captures.push(await capture(privatePage, output, "360-dark-memory-only-tour"));
    await privatePage.getByRole("button", { name: "Skip introduction", exact: true }).click();
    await privatePage.waitForURL((url) => url.pathname === "/home");
    assert.deepEqual(privateErrors, []);
    result.storageDeniedVisitStillWorks = true;
  } finally {
    await privateContext.close();
  }
  const malformed = await authContext(browser, production),
    corrupt = await malformed.newPage();
  await malformed.addInitScript(() => localStorage.setItem("campusone-auth", "{not valid JSON"));
  try {
    await visit(corrupt, production, "/sign-in");
    await corrupt.getByText(/Saved profile data could not be read/).waitFor();
    assert.equal((await stored(corrupt)).user, null);
    result.captures.push(await capture(corrupt, output, "360-light-corrupt-profile-recovered"));
    result.corruptProfileCleared = true;
  } finally {
    await malformed.close();
  }
  const guard = await authContext(browser, production),
    productionPage = await guard.newPage();
  try {
    await visit(productionPage, production, "/sign-in?auth-preview=error&next=https://evil.test");
    assert.equal(await productionPage.getByText(/Development-only/).count(), 0);
    await productionPage.getByRole("button", { name: "Sign in (demo)", exact: true }).click();
    await productionPage.waitForURL((url) => url.pathname === "/home");
    await noSecrets(productionPage, ["campusone-demo"]);
    result.productionIgnoresFixturesAndUnsafeNext = true;
  } finally {
    await guard.close();
  }
  return result;
}
