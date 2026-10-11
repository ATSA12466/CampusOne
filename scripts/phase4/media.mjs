import assert from "node:assert/strict";
import { homeContext, visit, capture, checkTrap, focusIs, selectVideo } from "./helpers.mjs";
export async function checkMedia(browser, baseUrl, output) {
  const cases = [];
  for (const width of [360, 768, 1280])
    for (const theme of ["light", "dark"]) {
      const context = await homeContext(browser, baseUrl, width, theme),
        page = await context.newPage(),
        media = [];
      page.on("request", (request) => {
        if (/\.(webm|vtt)(?:\?|$)/.test(request.url())) media.push(new URL(request.url()).pathname);
      });
      try {
        await visit(page, baseUrl);
        const trigger = await selectVideo(page);
        assert.deepEqual(media, []);
        await trigger.click();
        const dialog = page.getByRole("dialog", {
          name: "Pause. Breathe. Come back brighter.",
          exact: true,
        });
        await dialog.waitFor();
        const video = dialog.locator("video");
        await page.waitForFunction(() => document.querySelector("video")?.readyState >= 1);
        const state = await video.evaluate((node) => ({
          duration: node.duration,
          paused: node.paused,
          autoplay: node.autoplay,
          controls: node.controls,
          width: node.videoWidth,
          height: node.videoHeight,
        }));
        assert.equal(state.paused, true);
        assert.equal(state.autoplay, false);
        assert.equal(state.controls, true);
        assert.ok(state.duration > 5 && state.duration < 6);
        assert.equal(state.width, 960);
        assert.equal(state.height, 540);
        assert.ok(media.includes("/media/demo/flower.webm"));
        assert.ok(await dialog.getByText("Text alternative", { exact: true }).isVisible());
        assert.equal(await video.locator('track[kind="captions"]').count(), 1);
        const shot = await capture(page, output, `${width}-${theme}-video-player`);
        await checkTrap(page, dialog);
        await dialog.getByRole("button", { name: "Close dialog", exact: true }).focus();
        await page.keyboard.press("Control+k");
        assert.equal(await page.locator('[role="dialog"][data-state="open"]').count(), 1);
        assert.ok(await dialog.isVisible());
        await video.evaluate((node) => node.play());
        await page.waitForFunction(() => document.querySelector("video")?.paused === false);
        // Native Chromium media-control shadow UI consumes Escape before DOM dispatch.
        // Verify the application's Escape behaviour from its keyboard-reachable close control.
        await dialog.getByRole("button", { name: "Close dialog", exact: true }).focus();
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        await focusIs(page, trigger);
        assert.equal(await page.locator("video").count(), 0);
        cases.push({
          width,
          theme,
          state,
          shot,
          actuallyPlays: true,
          noAutoplay: true,
          transcriptAndCaptions: true,
          focusTrapAndReturn: true,
        });
      } finally {
        await context.close();
      }
    }
  const context = await homeContext(browser, baseUrl),
    page = await context.newPage();
  let blocked = true;
  await context.route("**/media/demo/flower.webm", (route) =>
    blocked ? route.abort("failed") : route.continue(),
  );
  try {
    await visit(page, baseUrl);
    await (await selectVideo(page)).click();
    const dialog = page.getByRole("dialog", {
      name: "Pause. Breathe. Come back brighter.",
      exact: true,
    });
    await dialog.getByRole("alert").filter({ hasText: "The video couldn't load" }).waitFor();
    const failed = await capture(page, output, "360-light-video-load-error");
    blocked = false;
    await dialog.getByRole("button", { name: "Retry video", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("video")?.readyState >= 1);
    await page.keyboard.press("Escape");
    return { cases, failed, retryRestoresPlayableVideo: true };
  } finally {
    await context.close();
  }
}
