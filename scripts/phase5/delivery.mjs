import assert from "node:assert/strict";
import { chunksWith, scriptName } from "../phase4/helpers.mjs";
import { authContext, capture, focusIs, stepIs, visit } from "./helpers.mjs";
export async function checkAuthDelivery(browser, base, output) {
  const editor = await chunksWith("Your photo, for this visit");
  assert.ok(editor.length);
  const context = await authContext(browser, base, 768, "light", false),
    page = await context.newPage(),
    scripts = [],
    shots = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(scriptName(request));
  });
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await context.route("**/_next/static/chunks/*.js", async (route) => {
    if (editor.includes(scriptName(route.request()))) await gate;
    await route.continue();
  });
  try {
    await visit(page, base, "/onboarding");
    for (let index = 1; index < 5; index++) {
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await stepIs(page, index + 1);
    }
    for (const chunk of editor)
      assert.equal(scripts.includes(chunk), false, `Eager editor: ${chunk}`);
    const trigger = page.getByRole("button", { name: "Add your own photo", exact: true });
    await trigger.click();
    await page.getByRole("button", { name: "Opening photo editor…", exact: true }).waitFor();
    const delivered = page.waitForResponse((response) =>
      editor.includes(new URL(response.url()).pathname.split("/").at(-1)),
    );
    await page.keyboard.press("Escape");
    await focusIs(page, trigger);
    release();
    await delivered;
    assert.equal(await page.getByRole("dialog").count(), 0);
    await trigger.click();
    await page.getByRole("dialog", { name: "Your photo, for this visit", exact: true }).waitFor();
    shots.push(await capture(page, output, "768-light-editor-delivered-after-cancel"));
  } finally {
    release();
    await context.close();
  }
  const failed = await authContext(browser, base, 360, "dark", false),
    failedPage = await failed.newPage();
  let blocked = true;
  await failed.route("**/_next/static/chunks/*.js", (route) =>
    blocked && editor.includes(scriptName(route.request()))
      ? route.abort("failed")
      : route.continue(),
  );
  try {
    await visit(failedPage, base, "/onboarding");
    for (let index = 1; index < 5; index++) {
      await failedPage.getByRole("button", { name: "Continue", exact: true }).click();
      await stepIs(failedPage, index + 1);
    }
    await failedPage.getByRole("button", { name: "Add your own photo", exact: true }).click();
    await failedPage
      .getByRole("alert")
      .filter({ hasText: "The photo editor couldn't load" })
      .waitFor();
    shots.push(await capture(failedPage, output, "360-dark-editor-code-error"));
    blocked = false;
    await Promise.all([
      failedPage.waitForNavigation({ waitUntil: "networkidle" }),
      failedPage.getByRole("button", { name: "reload the page", exact: true }).click(),
    ]);
    await stepIs(failedPage, 5);
    await failedPage.getByRole("button", { name: "Add your own photo", exact: true }).click();
    await failedPage
      .getByRole("dialog", { name: "Your photo, for this visit", exact: true })
      .waitFor();
  } finally {
    await failed.close();
  }
  const server = await authContext(browser, base, 1280),
    serverPage = await server.newPage();
  await server.route("**/_next/static/**/*.js", (route) => route.abort("blockedbyclient"));
  try {
    await serverPage.goto(`${base}/sign-in`, { waitUntil: "networkidle" });
    await serverPage.waitForFunction(() =>
      Array.from(document.querySelectorAll(".auth-photo-story img")).some(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    assert.equal(await serverPage.locator(".auth-photo-story img").isVisible(), true);
    shots.push(await capture(serverPage, output, "1280-light-auth-photo-without-hydration"));
  } finally {
    await server.close();
  }
  return {
    editorNotEager: true,
    cancelAndLateDeliveryDidNotOpen: true,
    editorCodeErrorAndReloadRecovered: true,
    serverPhotoVisibleWithoutHydration: true,
    screenshots: shots,
  };
}
