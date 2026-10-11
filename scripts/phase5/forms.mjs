import assert from "node:assert/strict";
import {
  authContext,
  capture,
  completeSignup,
  noSecrets,
  stored,
  visit,
  focusIs,
} from "./helpers.mjs";
export async function checkForms(browser, base, output) {
  const cases = [];
  for (const width of [360, 768, 1280])
    for (const scheme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, scheme),
        page = await context.newPage(),
        errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const screenshots = [],
        prefix = `${width}-${scheme}`;
      try {
        await visit(page, base, "/sign-in?next=/clubs");
        screenshots.push(await capture(page, output, `${prefix}-signin`));
        const password = page.getByLabel(/^Password/);
        await page.getByRole("button", { name: "Show password", exact: true }).click();
        assert.equal(await password.getAttribute("type"), "text");
        await page.getByRole("button", { name: "Hide password", exact: true }).click();
        assert.equal(await password.getAttribute("type"), "password");
        await page.getByLabel(/^Email/).fill("bad-email");
        await password.fill("short");
        await page.getByRole("button", { name: "Sign in (demo)", exact: true }).click();
        await page.locator("#auth-email-error").waitFor();
        await focusIs(page, page.locator("#auth-email"));
        screenshots.push(await capture(page, output, `${prefix}-signin-validation`));
        await page.getByLabel(/^Email/).fill("ama.nyarko@campusone.demo");
        await password.fill("campusone-demo");
        await page.getByRole("button", { name: "Sign in (demo)", exact: true }).click();
        await page.waitForURL((url) => url.pathname === "/clubs");
        assert.equal((await stored(page)).user.role, "student");
        await visit(page, base, "/forgot-password?next=/clubs");
        screenshots.push(await capture(page, output, `${prefix}-recovery`));
        await page.getByRole("button", { name: "Preview reset request", exact: true }).click();
        await page.locator("#auth-email-error").waitFor();
        await page.getByLabel(/^Email/).fill("esi.owusu@campusone.demo");
        await page.getByRole("button", { name: "Preview reset request", exact: true }).click();
        await page.getByRole("heading", { name: "Preview complete. No email was sent." }).waitFor();
        screenshots.push(await capture(page, output, `${prefix}-recovery-confirmed`));
        assert.ok(
          (await page.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).includes(
            "next=%2Fclubs",
          ),
        );
        await visit(page, base, "/register?next=/profile");
        screenshots.push(await capture(page, output, `${prefix}-register`));
        await page.getByRole("button", { name: "Create account (demo)", exact: true }).click();
        await page.locator("#auth-name-error").waitFor();
        await focusIs(page, page.locator("#auth-name"));
        await completeSignup(page);
        await page.getByLabel(/^Confirm password/).fill("not-matching");
        await page.getByRole("button", { name: "Create account (demo)", exact: true }).click();
        await page.locator("#auth-confirmPassword-error").waitFor();
        screenshots.push(await capture(page, output, `${prefix}-register-validation`));
        await page.getByLabel(/^Confirm password/).fill("preview-password");
        await page.getByRole("button", { name: "Create account (demo)", exact: true }).click();
        await page.waitForURL(
          (url) => url.pathname === "/onboarding" && url.searchParams.get("next") === "/profile",
        );
        const profile = await stored(page);
        assert.equal(profile.user.name, "Esi Owusu");
        assert.equal(profile.user.email, "esi.owusu@campusone.demo");
        assert.ok(profile.user.id.startsWith("local-"));
        await page.getByRole("button", { name: "Skip introduction", exact: true }).click();
        await page.waitForURL((url) => url.pathname === "/profile");
        await page.getByRole("heading", { name: "Esi Owusu", exact: true }).waitFor();
        await noSecrets(page, ["preview-password", "campusone-demo", "not-matching", "blob:"]);
        assert.deepEqual(errors, []);
        cases.push({
          width,
          scheme,
          validationFocus: true,
          passwordToggle: true,
          safeReturnPath: true,
          registrationUsedProfile: true,
          recoveryDidNotClaimEmail: true,
          noSecrets: true,
          screenshots,
        });
      } finally {
        await context.close();
      }
    }
  return cases;
}
