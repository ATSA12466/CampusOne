import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import vm from "node:vm";
const { themeInitScript } = await import("../../src/config/theme.ts");
function initialize(preference, systemDark, denied = false) {
  const root = { dataset: {}, style: {} };
  vm.runInNewContext(themeInitScript, {
    document: { documentElement: root },
    localStorage: {
      getItem() {
        if (denied) throw new Error("denied");
        return preference;
      },
    },
    matchMedia: () => ({ matches: systemDark }),
  });
  return root;
}
test("first-paint bootstrap honors all preferences and private mode", () => {
  for (const preference of ["light", "dark", "system", null, "invalid"])
    for (const systemDark of [false, true]) {
      const root = initialize(preference, systemDark);
      const valid = ["light", "dark", "system"].includes(preference) ? preference : "system";
      assert.equal(root.dataset.themePreference, valid);
      assert.equal(
        root.dataset.theme,
        valid === "dark" || (valid === "system" && systemDark) ? "dark" : "light",
      );
      assert.equal(root.style.colorScheme, root.dataset.theme);
    }
  assert.equal(initialize(null, true, true).dataset.theme, "dark");
});
const css = readFileSync("src/app/globals.css", "utf8");
function variables(block) {
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)].map((m) => [m[1], m[2]]),
  );
}
const light = variables(css.match(/:root,\s*\[data-theme="light"\]\s*\{([\s\S]*?)\}/)[1]);
const dark = variables(css.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/)[1]);
const invariant = variables(css.match(/\n:root \{([\s\S]*?)\}/)[1]);
function lum(hex) {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function ratio(a, b) {
  const x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
test("semantic text pairs exceed 4.5:1 in light and dark", () => {
  const pairs = [
    ["foreground", "background"],
    ["foreground", "surface"],
    ["muted-foreground", "surface"],
    ["muted-foreground", "surface-muted"],
    ["subtle-foreground", "background"],
    ["brand", "surface"],
    ["brand-foreground", "brand"],
    ["accent-foreground", "accent"],
    ["success", "success-soft"],
    ["warning", "warning-soft"],
    ["danger", "danger-soft"],
  ];
  for (const [mode, tokens] of [
    ["light", light],
    ["dark", dark],
  ])
    for (const [a, b] of pairs)
      assert.ok(
        ratio(tokens[a], tokens[b]) >= 4.5,
        `${mode} ${a}/${b}: ${ratio(tokens[a], tokens[b]).toFixed(2)}`,
      );
  assert.ok(ratio(invariant["nav-muted"], invariant.nav) >= 4.5);
});
test("field boundaries and focus indicators meet 3:1 against surfaces", () => {
  for (const tokens of [light, dark])
    for (const surface of ["background", "surface", "surface-muted"])
      for (const role of ["control-border", "focus"])
        assert.ok(ratio(tokens[role], tokens[surface]) >= 3, `${role}/${surface}`);
});
test("no .env file is eligible for a commit", () => {
  const ignored = execFileSync(
    "git",
    ["check-ignore", ".env.example", ".env.local", ".env.production"],
    { encoding: "utf8" },
  );
  assert.ok(ignored.includes(".env.example"));
  assert.ok(ignored.includes(".env.production"));
});
