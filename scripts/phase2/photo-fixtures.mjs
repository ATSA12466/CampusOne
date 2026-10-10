import assert from "node:assert/strict";

export async function assertCropPixels(sharp, original, output) {
  // Independent expected crop for focus 70/50, zoom 1.8, square 1376×768 input.
  const side = 768 / 1.8;
  const expected = await sharp(original)
    .extract({
      left: Math.floor((1376 - side) * 0.7),
      top: Math.floor((768 - side) * 0.5),
      width: Math.floor(side),
      height: Math.floor(side),
    })
    .resize(32, 32)
    .removeAlpha()
    .raw()
    .toBuffer();
  const actual = await sharp(output).resize(32, 32).removeAlpha().raw().toBuffer();
  assert.equal(actual.length, expected.length);
  const meanError =
    actual.reduce((sum, value, index) => sum + Math.abs(value - expected[index]), 0) /
    actual.length;
  // JPEG/resampling tolerance, while rejecting a materially different crop/focus.
  assert.ok(meanError < 6, `Crop pixel mean error ${meanError} is too large`);
  return Math.round(meanError * 100) / 100;
}
export async function assertLargeImage(sharp, file, page) {
  const large = await sharp("public/images/demo/campus-life.webp")
    .resize(3200, 1800)
    .jpeg({ quality: 94 })
    .toBuffer();
  await file.setInputFiles({
    name: "large-camera-photo.jpg",
    mimeType: "image/jpeg",
    buffer: large,
  });
  await page.getByRole("button", { name: "Use this photo", exact: true }).click();
  await page.getByText("Ready for upload", { exact: true }).waitFor();
  const link = page.getByRole("link", { name: "Download prepared photo", exact: true });
  const uri = await link.getAttribute("href");
  const bytes = Buffer.from(
    await page.evaluate(
      async (url) => Array.from(new Uint8Array(await (await fetch(url)).arrayBuffer())),
      uri,
    ),
  );
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.width, 1600);
  assert.equal(metadata.height, 1600);
  assert.ok(bytes.length <= 512 * 1024);
  return { width: metadata.width, height: metadata.height, bytes: bytes.length };
}
