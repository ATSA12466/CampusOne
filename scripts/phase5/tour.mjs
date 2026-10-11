import assert from "node:assert/strict";
import { authContext, capture, stored, focusIs, stepIs, noSecrets } from "./helpers.mjs";
export async function checkTour(browser, base, output) {
  const cases = [];
  for (const width of [360, 768, 1280])
    for (const scheme of ["light", "dark"]) {
      const context = await authContext(browser, base, width, scheme, false),
        page = await context.newPage(),
        errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const shots = [],
        prefix = `${width}-${scheme}`;
      try {
        await page.goto(`${base}/events/e1`, { waitUntil: "networkidle" });
        await page.waitForURL(
          (url) => url.pathname === "/onboarding" && url.searchParams.get("next") === "/events/e1",
        );
        await stepIs(page, 1);
        shots.push(await capture(page, output, `${prefix}-tour-1`));
        await page.getByRole("button", { name: "Continue", exact: true }).click();
        await stepIs(page, 2);
        await focusIs(page, page.locator(".auth-form-panel h2").first());
        shots.push(await capture(page, output, `${prefix}-tour-2`));
        await page.getByRole("button", { name: "Back", exact: true }).click();
        await stepIs(page, 1);
        await page.getByRole("button", { name: "Continue", exact: true }).click();
        await stepIs(page, 2);
        await page.getByRole("button", { name: "Continue", exact: true }).click();
        await stepIs(page, 3);
        shots.push(await capture(page, output, `${prefix}-tour-3`));
        await page.reload({ waitUntil: "networkidle" });
        await stepIs(page, 3);
        await page.getByRole("button", { name: "Continue", exact: true }).click();
        await stepIs(page, 4);
        shots.push(await capture(page, output, `${prefix}-tour-4`));
        await page.getByRole("button", { name: "Continue", exact: true }).click();
        await stepIs(page, 5);
        shots.push(await capture(page, output, `${prefix}-tour-5`));
        await page.getByLabel(/^Your name/).fill("");
        await page.getByRole("button", { name: "Finish and continue", exact: true }).click();
        await page.locator("#setup-name-error").waitFor();
        await focusIs(page, page.locator("#setup-name"));
        shots.push(await capture(page, output, `${prefix}-profile-validation`));
        await page.getByLabel(/^Your name/).fill("Akosua Mensah");
        await page.getByLabel(/^Demo programme/).selectOption("BSc Computer Science");
        await page.getByLabel(/^Level/).selectOption("Level 200");
        await page.getByRole("radio", { name: "Demo portrait B", exact: true }).click();
        await page.getByRole("checkbox", { name: "Clubs & societies", exact: true }).check();
        await page.getByRole("button", { name: "Back", exact: true }).click();
        await stepIs(page, 4);
        await page.getByRole("button", { name: "Continue", exact: true }).click();
        await stepIs(page, 5);
        assert.equal(await page.getByLabel(/^Your name/).inputValue(), "Akosua Mensah");
        assert.equal(await page.getByLabel(/^Demo programme/).inputValue(), "BSc Computer Science");
        assert.equal(
          await page
            .getByRole("radio", { name: "Demo portrait B", exact: true })
            .getAttribute("aria-checked"),
          "true",
        );
        await page.getByRole("button", { name: "Finish and continue", exact: true }).click();
        await page.waitForURL((url) => url.pathname === "/events/e1");
        const auth = await stored(page),
          intro = await stored(page, "campusone-onboarding");
        assert.equal(auth.user.name, "Akosua Mensah");
        assert.equal(auth.user.level, "Level 200");
        assert.equal(auth.user.programme, "BSc Computer Science");
        assert.ok(auth.user.avatar.endsWith("student-kojo.webp"));
        assert.equal(intro.completed, true);
        assert.deepEqual(intro.preferences.interests, ["Clubs & societies"]);
        await page.reload({ waitUntil: "networkidle" });
        assert.equal(new URL(page.url()).pathname, "/events/e1");
        await page.getByRole("link", { name: "Open Akosua Mensah profile", exact: true }).waitFor();
        await noSecrets(page, ["blob:"]);
        assert.deepEqual(errors, []);
        cases.push({
          width,
          scheme,
          firstVisitRedirect: true,
          originalDestinationRestored: true,
          persistedProgress: true,
          focusOnStepChange: true,
          draftSurvivedBack: true,
          profileUsed: true,
          screenshots: shots,
        });
      } finally {
        await context.close();
      }
    }
  return cases;
}
