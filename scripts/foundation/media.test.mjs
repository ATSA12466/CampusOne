import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
const { cropRectangle } = await import("../../src/lib/media/crop.ts");
const { imageFileSchema } = await import("../../src/components/media/validation/image.schema.ts");
const { images, isAllowedImageSrc, imageForSrc, srcLogo } = await import("../../src/config/images.ts");
const crop = { x: 50, y: 50, zoom: 1, aspect: 1 };
test("crop geometry centers, zooms and clamps a square", () => {
  assert.deepEqual(cropRectangle(1600, 900, crop), { x: 350, y: 0, width: 900, height: 900 });
  assert.deepEqual(cropRectangle(1600, 900, { ...crop, x: 100, zoom: 2 }), {
    x: 1150,
    y: 225,
    width: 450,
    height: 450,
  });
  assert.deepEqual(cropRectangle(100, 100, { ...crop, x: -5, y: 105, zoom: 0 }), {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
});
test("crop bounds hold across 625 focal/aspect/zoom combinations", () => {
  for (const width of [320, 1376, 4032, 9000, 1])
    for (const aspect of [1, 0.8, 16 / 9, 3 / 4, 21 / 9])
      for (const focus of [0, 25, 50, 75, 100])
        for (const zoom of [1, 1.5, 2, 2.5, 3]) {
          const rect = cropRectangle(width, 768, { x: focus, y: focus, aspect, zoom });
          assert.ok(rect.x >= 0 && rect.y >= 0 && rect.width > 0 && rect.height > 0);
          assert.ok(rect.x + rect.width <= width + 1e-7 && rect.y + rect.height <= 768 + 1e-7);
          assert.ok(Math.abs(rect.width / rect.height - aspect) < 1e-7);
        }
});
test("invalid dimensions and non-finite crop values fail safely", () => {
  for (const [width, height, settings] of [
    [0, 2, crop],
    [-1, 2, crop],
    [Infinity, 2, crop],
    [2, 2, { ...crop, aspect: 0 }],
    [2, 2, { ...crop, x: NaN }],
    [2, 2, { ...crop, zoom: Infinity }],
  ])
    assert.throws(() => cropRectangle(width, height, settings));
});
test("file validation rejects unsupported, empty, oversized and non-file inputs", () => {
  assert.equal(
    imageFileSchema.safeParse(new File(["x"], "valid.jpg", { type: "image/jpeg" })).success,
    true,
  );
  for (const type of ["image/svg+xml", "image/gif", "image/heic", "application/pdf"])
    assert.equal(imageFileSchema.safeParse(new File(["x"], "invalid", { type })).success, false);
  for (const file of [
    new File([], "empty.jpg", { type: "image/jpeg" }),
    new File([new Uint8Array(12 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }),
    undefined,
    {},
    "photo",
  ])
    assert.equal(imageFileSchema.safeParse(file).success, false);
});
test("registry assets have meaningful alt, provenance and real local files", () => {
  for (const [key, image] of Object.entries(images)) {
    assert.ok(image.alt.length > 12, key);
    assert.ok(image.width > 0 && image.height > 0, key);
    assert.ok(["generated", "placeholder", "licensed", "upload"].includes(image.provenance));
    if (key !== "unavailable") assert.ok(existsSync(`public${image.src}`), image.src);
    assert.equal(imageForSrc(image.src)?.src, image.src);
  }
  assert.equal(isAllowedImageSrc("/images/demo/campus-life.webp"), true);
  assert.equal(isAllowedImageSrc("blob:example"), true);
  for (const source of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "//example.org/photo.jpg",
    "http://example.org/photo.jpg",
    "https://unapproved.example.org/photo.jpg",
  ])
    assert.equal(isAllowedImageSrc(source), false, source);
  assert.ok(
    readFileSync("src/app/fonts/Manrope-OFL.txt", "utf8").includes("SIL OPEN FONT LICENSE"),
  );
});

function pngSize(file) {
  const header = readFileSync(file).subarray(0, 24);
  assert.equal(header.subarray(1, 4).toString("ascii"), "PNG", `${file} must be a PNG`);
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}
test("the header brand renders supplied artwork without a drawn frame", () => {
  const mark = readFileSync("src/components/shared/brand-mark.tsx", "utf8");
  assert.ok(mark.includes("srcLogo?.src"), "the mark must use the supplied crest");
  assert.ok(!mark.includes("logo slot"), "the empty placeholder slot must be gone");
  assert.ok(!mark.includes("border-current"), "no square frame may be drawn around the logo");
  assert.ok(mark.includes("onError"), "a broken logo must degrade instead of showing a frame");
});
test("owner-supplied SRC crest and app icon are wired into the web", () => {
  // Supplied by the council, so the branded logo slot is no longer empty.
  assert.ok(srcLogo, "srcLogo must carry the supplied crest");
  assert.equal(srcLogo.provenance, "upload");
  assert.ok(srcLogo.alt.length > 12);
  assert.ok(existsSync(`public${srcLogo.src}`), srcLogo.src);
  assert.equal(isAllowedImageSrc(srcLogo.src), true);
  // Masters stay untouched at the repository root; only scaled copies are generated.
  for (const master of ["SRCLogo.png", "campusone_app_icon.png"]) {
    const size = pngSize(master);
    assert.deepEqual(size, { width: 1024, height: 1024 }, master);
  }
  for (const file of [
    "app-icon-512.png",
    "apple-touch-icon-180.png",
    "favicon-32.png",
    "src-crest-512.png",
  ]) {
    assert.ok(existsSync(`public/brand/${file}`), file);
  }
  assert.deepEqual(pngSize("public/brand/app-icon-512.png"), { width: 512, height: 512 });
  assert.deepEqual(pngSize("public/brand/src-crest-512.png"), { width: 512, height: 512 });
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  assert.ok(layout.includes("/brand/favicon-32.png"), "root layout must serve the favicon");
  assert.ok(
    layout.includes("/brand/apple-touch-icon-180.png"),
    "root layout must serve the apple touch icon",
  );
});
