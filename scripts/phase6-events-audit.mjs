import { mkdir, writeFile } from "node:fs/promises";
import { launchAuditBrowser } from "./audit/browser.mjs";
import { directoryChecks, detailMatrix } from "./phase6/events/directory.mjs";
import { workflowChecks } from "./phase6/events/workflows.mjs";
import {
  clockChecks,
  privacyChecks,
  resilienceChecks,
  deliveryChecks,
} from "./phase6/events/states.mjs";
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3001",
  output = process.env.AUDIT_OUTPUT_DIR ?? ".cache/phase6/events/browser";
await mkdir(output, { recursive: true });
const browser = await launchAuditBrowser([], { multiProcess: true });
try {
  const checks = {};
  for (const [name, run] of Object.entries({
    directory: directoryChecks,
    details: detailMatrix,
    workflow: workflowChecks,
    clock: clockChecks,
    privacy: privacyChecks,
    resilience: resilienceChecks,
    delivery: deliveryChecks,
  })) {
    if (process.env.AUDIT_GROUPS && !process.env.AUDIT_GROUPS.split(",").includes(name)) continue;
    checks[name] = await run(browser, base, output);
    await writeFile(`${output}/checks.json`, JSON.stringify(checks, null, 2));
  }
  console.log("Events browser groups passed:", Object.keys(checks));
} finally {
  await browser.close();
  console.log("Events browser cleanup complete; Node exit state:", process.exitCode ?? 0);
}
