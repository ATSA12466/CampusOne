// Mobile suite runner (no Flutter SDK required): structural audit of the app.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const files = ["./mobile/mobile-structure.test.mjs"];
const cwd = fileURLToPath(new URL("./", import.meta.url));
let failed = 0;
for (const file of files) {
  console.log(`\n--- mobile file: ${file} ---`);
  const result = spawnSync(process.execPath, ["--test", file], {
    cwd,
    stdio: "inherit",
    timeout: 120000,
  });
  if (result.error || result.signal || result.status !== 0) {
    console.error(`mobile file failed: ${file}`, result.error?.message ?? result.signal ?? result.status);
    failed += 1;
  }
}
if (failed > 0) {
  console.error(`\n${failed} mobile test file(s) failed.`);
  process.exit(1);
}
console.log("\nAll mobile test files passed.");
