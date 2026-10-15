/**
 * Regenerate every platform icon from the owner-supplied masters.
 *
 * Masters (kept exactly as supplied — never recoloured, redrawn or cropped):
 *   campusone_app_icon.png  GCTU SRC crest on the CampusOne brand gradient
 *   SRCLogo.png             the same crest with a transparent background
 *
 * Targets:
 *   mobile/assets/icon-1024.png                        in-app app mark (pubspec)
 *   mobile/assets/src-crest.png                        transparent crest for SRC surfaces
 *   mobile/android/<res>/mipmap-<density>/ic_launcher.png            legacy launcher icon
 *   mobile/android/<res>/mipmap-<density>/ic_launcher_foreground.png adaptive foreground, safe zone
 *   mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/<files>     iOS icon set
 *   public/brand/<files>            web icon, apple-touch-icon, favicon, crest
 *
 * Usage:  node scripts/brand-icons.mjs
 * Needs:  sharp (already present through the Next.js toolchain) or ImageMagick.
 */
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const APP_ICON = join(root, "campusone_app_icon.png");
const CREST = join(root, "SRCLogo.png");

for (const master of [APP_ICON, CREST]) {
  if (!existsSync(master)) {
    console.error(`Missing master artwork: ${master}\nKeep the owner's uploads at the repository root.`);
    process.exit(2);
  }
}

let resize;
try {
  const sharp = (await import("sharp")).default;
  resize = async (source, target, size, { opaque = false, pad = 0 } = {}) => {
    mkdirSync(dirname(target), { recursive: true });
    // Masters are square and already centred, so "contain" is lossless here.
    let pipeline = sharp(source).resize(
      pad > 0 ? Math.round(size * pad) : size,
      pad > 0 ? Math.round(size * pad) : size,
      { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } },
    );
    if (pad > 0) {
      // Centre the crest inside the adaptive-icon safe zone on a transparent canvas.
      const inner = Math.round(size * pad);
      const top = Math.floor((size - inner) / 2);
      const left = Math.floor((size - inner) / 2);
      pipeline = pipeline.extend({
        top,
        bottom: size - inner - top,
        left,
        right: size - inner - left,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    }
    if (opaque) pipeline = pipeline.flatten({ background: "#0B2545" });
    await pipeline.png({ compressionLevel: 9 }).toFile(target);
    console.log(`  ${target.replace(root + "/", "")} (${size}px)`);
  };
} catch {
  const { spawnSync } = await import("node:child_process");
  const magick = (() => {
    for (const candidate of ["magick", "convert"]) {
      if (spawnSync(candidate, ["-version"], { stdio: "ignore" }).status === 0) return candidate;
    }
    return null;
  })();
  if (!magick) {
    console.error("Neither sharp nor ImageMagick is available. Install one and re-run.");
    process.exit(2);
  }
  resize = async (source, target, size, { opaque = false, pad = 0 } = {}) => {
    mkdirSync(dirname(target), { recursive: true });
    const args = pad > 0
      ? ["-background", "none", "-resize", String(Math.round(size * pad)), "-gravity", "center", "-extent", `${size}x${size}`, source, target]
      : ["-resize", `${size}x${size}!`, source, target];
    if (opaque) args.splice(args.length - 2, 0, "-background", "#0B2545", "-alpha", "remove", "-alpha", "off");
    const result = spawnSync(magick, args, { stdio: "inherit" });
    if (result.status !== 0) process.exit(result.status ?? 1);
    console.log(`  ${target.replace(root + "/", "")} (${size}px)`);
  };
}

const ANDROID = join(root, "mobile/android/app/src/main/res");
const DENSITIES = [
  ["mdpi", 48, 108],
  ["hdpi", 72, 162],
  ["xhdpi", 96, 216],
  ["xxhdpi", 144, 324],
  ["xxxhdpi", 192, 432],
];

console.log("Android launcher icons");
for (const [density, legacy, adaptive] of DENSITIES) {
  await resize(APP_ICON, join(ANDROID, `mipmap-${density}/ic_launcher.png`), legacy, { opaque: true });
  // Adaptive foregrounds get the crest inside the 66% safe zone, background colour #0B2545.
  await resize(CREST, join(ANDROID, `mipmap-${density}/ic_launcher_foreground.png`), adaptive, { pad: 0.58 });
}

console.log("iOS app icon set");
const IOS = join(root, "mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset");
// iOS names files by points x points @ scale; the PNG must be points * scale pixels wide.
for (const file of readdirSync(IOS)) {
  const match = /^Icon-App-(\d+(?:\.\d+)?)x\d+(?:\.\d+)?@(\d+)x\.png$/.exec(file);
  if (!match) continue;
  const pixels = Math.round(Number(match[1]) * Number(match[2]));
  await resize(APP_ICON, join(IOS, file), pixels, { opaque: true });
}

console.log("App assets and web icons");
await resize(APP_ICON, join(root, "mobile/assets/icon-1024.png"), 1024, { opaque: true });
await resize(CREST, join(root, "mobile/assets/src-crest.png"), 512); // transparent, keeps its alpha
await resize(APP_ICON, join(root, "public/brand/app-icon-512.png"), 512, { opaque: true });
await resize(APP_ICON, join(root, "public/brand/apple-touch-icon-180.png"), 180, { opaque: true });
await resize(APP_ICON, join(root, "public/brand/favicon-32.png"), 32, { opaque: true });
await resize(CREST, join(root, "public/brand/src-crest-512.png"), 512);
console.log("Done — masters untouched.");
