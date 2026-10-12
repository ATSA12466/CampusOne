import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { evaluateDependencyAudits } from "./dependency-policy.mjs";
import { nativeSuites, selectedNativeSuites } from "./native-suites.mjs";
const policy = JSON.parse(
    readFileSync(
      new URL("../../config/dependency-audit-policy.json", import.meta.url),
    ),
  ),
  today = new Date("2026-10-11T12:00:00Z");
const report = (vulnerabilities = {}) => ({
  vulnerabilities,
  metadata: { vulnerabilities: { total: Object.keys(vulnerabilities).length } },
});
const leaf = () => ({
  severity: "high",
  via: [
    {
      name: "braces",
      url: policy.knownDevelopmentRisk.advisory,
      severity: "high",
    },
  ],
});
const chain = () =>
  report({
    braces: leaf(),
    micromatch: { severity: "high", via: ["braces"] },
    "fast-glob": { severity: "high", via: ["micromatch"] },
    "@next/eslint-plugin-next": { severity: "high", via: ["fast-glob"] },
    "eslint-config-next": {
      severity: "high",
      via: ["@next/eslint-plugin-next"],
    },
  });
test("Clean audits require no known-risk exception", () =>
  assert.equal(
    evaluateDependencyAudits(report(), report(), policy, today)
      .knownDevelopmentRisk,
    null,
  ));
test("Only the exact reviewed development-only chain is reported, never hidden as zero", () => {
  const result = evaluateDependencyAudits(report(), chain(), policy, today);
  assert.equal(result.fullVulnerabilities, 5);
  assert.equal(result.knownDevelopmentRisk.severity, "high");
});
test("Any production vulnerability fails, including the known dev advisory", () =>
  assert.throws(
    () =>
      evaluateDependencyAudits(
        report({ braces: leaf() }),
        chain(),
        policy,
        today,
      ),
    /Production/,
  ));
test("An unknown affected package fails even if it references the known leaf", () => {
  const full = chain();
  full.vulnerabilities.other = { severity: "high", via: ["braces"] };
  full.metadata.vulnerabilities.total++;
  assert.throws(
    () => evaluateDependencyAudits(report(), full, policy, today),
    /Unreviewed/,
  );
});
test("New advisory details on an allowed package fail", () => {
  const full = chain();
  full.vulnerabilities.braces.via[0].url =
    "https://github.com/advisories/GHSA-unknown";
  assert.throws(
    () => evaluateDependencyAudits(report(), full, policy, today),
    /Unreviewed/,
  );
});
test("A severity escalation fails", () => {
  const full = chain();
  full.vulnerabilities.braces.severity = "critical";
  assert.throws(
    () => evaluateDependencyAudits(report(), full, policy, today),
    /Unreviewed/,
  );
});
test("Expired review cannot become an indefinite waiver", () =>
  assert.throws(
    () =>
      evaluateDependencyAudits(
        report(),
        chain(),
        policy,
        new Date("2026-11-12"),
      ),
    /fresh review/,
  ));
test("Invalid or incomplete npm results fail closed", () => {
  for (const invalid of [
    null,
    { error: { code: "NETWORK" } },
    report({ braces: { severity: "high", via: [] } }),
    { vulnerabilities: {}, metadata: { vulnerabilities: { total: 1 } } },
  ])
    assert.throws(
      () => evaluateDependencyAudits(report(), invalid, policy, today),
      /audit/i,
    );
});
test("Native suites enumerate every maintained runner and preserve isolation", () => {
  const selected = selectedNativeSuites([]);
  assert.equal(selected.length, 14);
  for (const suite of selected) assert.ok(existsSync(suite.file));
  assert.deepEqual(
    selectedNativeSuites(["home", "release"]).map((s) => s.name),
    ["home", "release"],
  );
  assert.ok(Object.isFrozen(nativeSuites));
});
test("Unknown/duplicate suite names cannot silently skip verification", () => {
  assert.throws(() => selectedNativeSuites(["missing"]));
  assert.throws(() => selectedNativeSuites(["home", "home"]));
});
test("Drizzle configuration has no checked-in local credential fallback", () => {
  const config = readFileSync(
    new URL("../../drizzle.config.ts", import.meta.url),
    "utf8",
  );
  assert.ok(config.includes("process.env.DATABASE_URL"));
  assert.ok(!/postgres(?:ql)?:\/\//.test(config));
  assert.ok(!existsSync(new URL("../../drizzle.config.json", import.meta.url)));
});
