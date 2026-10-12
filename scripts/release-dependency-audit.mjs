import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { evaluateDependencyAudits } from "./release/dependency-policy.mjs";
const root = new URL("../", import.meta.url),
  output = process.env.AUDIT_OUTPUT_DIR ?? ".cache/release/dependencies";
function audit(args) {
  const cli = process.env.npm_execpath;
  const result = spawnSync(
    cli ? process.execPath : "npm",
    cli ? [cli, "audit", ...args, "--json"] : ["audit", ...args, "--json"],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 120000,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  if (result.error || result.signal || ![0, 1].includes(result.status))
    throw result.error ?? new Error("npm audit could not complete.");
  const report = JSON.parse(result.stdout);
  if (report.error)
    throw new Error("npm audit reported a registry/tooling error.");
  return report;
}
const runtime = audit(["--omit=dev"]),
  full = audit([]),
  policy = JSON.parse(
    await readFile(
      new URL("../config/dependency-audit-policy.json", import.meta.url),
      "utf8",
    ),
  );
const verdict = evaluateDependencyAudits(runtime, full, policy);
await mkdir(output, { recursive: true });
for (const [name, report] of Object.entries({ runtime, full, verdict }))
  await writeFile(
    `${output}/${name}.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
console.log(JSON.stringify(verdict, null, 2));
if (verdict.knownDevelopmentRisk)
  console.warn(
    `Known HIGH development advisory remains (${verdict.fullVulnerabilities} affected packages), not a clean full audit. Review by ${verdict.knownDevelopmentRisk.reviewBy}: ${verdict.knownDevelopmentRisk.advisory}`,
  );
if (process.env.GITHUB_ACTIONS === "true" && verdict.knownDevelopmentRisk)
  console.log(
    "::warning title=Known development dependency risk::The unpatched braces advisory remains in lint tooling. Production audit is zero; unexpected advisories fail verification.",
  );
