import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { assertCropPixels, assertLargeImage } from "./photo-fixtures.mjs";
import { restrictToApp, waitForScreen } from "../audit/browser.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
export async function checkUpload(browser, baseUrl, output) {
  const context = await browser.newContext({
    viewport: { width: 360, height: 900 },
    reducedMotion: "reduce",
    acceptDownloads: true,
  });
  await restrictToApp(context, baseUrl);
  await context.addInitScript(() => {
    const create = URL.createObjectURL.bind(URL),
      revoke = URL.revokeObjectURL.bind(URL);
    window.photoUrlStats = { created: 0, revoked: 0, active: [] };
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      window.photoUrlStats.created++;
      window.photoUrlStats.active.push(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      window.photoUrlStats.revoked++;
      window.photoUrlStats.active = window.photoUrlStats.active.filter((value) => value !== url);
      revoke(url);
    };
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/design`, { waitUntil: "networkidle" });
  await waitForScreen(page);
  const file = page.locator('#uploads input[type="file"]');
  const region = page.getByRole("region", { name: "Make it yours", exact: true });
  await file.setInputFiles({
    name: "unsafe.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await region.getByRole("alert").waitFor();
  assert.ok((await region.getByRole("alert").textContent()).includes("JPG"));
  await file.setInputFiles({
    name: "oversized.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.alloc(12 * 1024 * 1024 + 1),
  });
  await region.getByText("Choose a photo smaller than 12 MB", { exact: true }).waitFor();
  await file.setInputFiles({
    name: "corrupt.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("not an image"),
  });
  await region
    .getByText("We couldn't open this photo. Choose a different JPG, PNG or WebP.", { exact: true })
    .waitFor();
  const tooManyPixels = await sharp({
    create: { width: 7000, height: 6000, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await file.setInputFiles({
    name: "42-megapixel.png",
    mimeType: "image/png",
    buffer: tooManyPixels,
  });
  await region
    .getByText("This photo is very large. Choose one below 40 megapixels.", { exact: true })
    .waitFor();
  const original = await sharp("public/images/demo/campus-life.webp")
    .jpeg({ quality: 94 })
    .withExif({ IFD0: { Artist: "CampusOne metadata-removal test fixture" } })
    .toBuffer();
  assert.ok((await sharp(original).metadata()).exif);
  await file.setInputFiles({
    name: "campus-life-with-metadata.jpg",
    mimeType: "image/jpeg",
    buffer: original,
  });
  await page.getByRole("button", { name: "Use this photo", exact: true }).waitFor();
  const zoom = page.getByLabel("Zoom", { exact: true });
  await zoom.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await zoom.inputValue(), "1.1");
  const horizontal = page.getByLabel("Horizontal focus", { exact: true });
  await horizontal.fill("70");
  await zoom.fill("1.8");
  const simulate = page.getByRole("checkbox", { name: "Simulate a callback failure", exact: true });
  await simulate.check();
  await page.getByRole("button", { name: "Use this photo", exact: true }).click();
  await region
    .getByText("The preview callback failed. Your photo is still here — try again.", {
      exact: true,
    })
    .waitFor();
  await simulate.uncheck();
  await region.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByText("Ready for upload", { exact: true }).waitFor();
  const pending = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download prepared photo", exact: true }).click();
  const download = await pending;
  const path = `${output}/prepared-photo.jpg`;
  await download.saveAs(path);
  const bytes = await readFile(path);
  const meta = await sharp(bytes).metadata();
  assert.equal(meta.format, "jpeg");
  assert.equal(meta.width, meta.height);
  assert.ok(Math.max(meta.width, meta.height) <= 1600);
  assert.ok(bytes.length <= 512 * 1024);
  assert.equal(meta.exif, undefined);
  const cropPixelMeanError = await assertCropPixels(sharp, original, bytes);
  await page.screenshot({ path: `${output}/upload-360.png`, animations: "disabled" });
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page.getByRole("button", { name: "Choose photo", exact: true }).waitFor();
  assert.ok((await page.evaluate(() => window.photoUrlStats)).revoked >= 1);
  const largeOutput = await assertLargeImage(sharp, file, page);
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page.getByRole("link", { name: "CampusOne home", exact: true }).click();
  await page.waitForURL("**/home");
  await page.waitForFunction(() => window.photoUrlStats.active.length === 0);
  const urls = await page.evaluate(() => window.photoUrlStats);
  assert.equal(urls.active.length, 0);
  await context.close();
  return {
    unsupportedMime: true,
    maxFileBytes: true,
    maxMegapixels: true,
    largeOutput,
    corruptImage: true,
    callbackFailureAndRetry: true,
    keyboardCrop: true,
    cropMatchesOutput: true,
    cropPixelMeanError,
    jpegBytes: bytes.length,
    width: meta.width,
    height: meta.height,
    exifRemoved: true,
    objectUrlsCreated: urls.created,
    objectUrlsRevoked: urls.revoked,
  };
}
