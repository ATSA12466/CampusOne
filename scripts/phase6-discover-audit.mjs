import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
import { directoryChecks } from "./phase6/discover/directory.mjs";
import { workflowChecks } from "./phase6/discover/workflows.mjs";
import {
  privacyChecks,
  resilienceChecks,
  deliveryChecks,
  clockChecks,
} from "./phase6/discover/states.mjs";
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3001",
  output = process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase6/discover/browser";
await mkdir(output, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true });
try {
  const checks = {};
  for (const [name, run] of Object.entries({
    directory: directoryChecks,
    workflow: workflowChecks,
    privacy: privacyChecks,
    resilience: resilienceChecks,
    delivery: deliveryChecks,
    clock: clockChecks,
  })) {
    if (
      process.env.AUDIT_GROUPS &&
      !process.env.AUDIT_GROUPS.split(",").includes(name)
    )
      continue;
    checks[name] = await run(browser, base, output);
    await writeFile(`${output}/checks.json`, JSON.stringify(checks, null, 2));
  }
  console.log("Discover browser groups passed:", Object.keys(checks));
} finally {
  await browser.close();
}
