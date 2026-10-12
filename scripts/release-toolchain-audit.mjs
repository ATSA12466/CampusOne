import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { relative, resolve } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url)),
  output = resolve(
    root,
    process.env.AUDIT_OUTPUT_DIR ?? ".cache/release/toolchain",
  );
await mkdir(output, { recursive: true });
const temp = await mkdtemp(output + "/offline-"),
  folder = relative(root, temp);
await writeFile(
  temp + "/columns.ts",
  'export enum RecordKind { Planner = "planner" }\n',
);
await writeFile(
  temp + "/schema.ts",
  'import {pgTable,integer,text} from "drizzle-orm/pg-core";\nimport {RecordKind} from "./columns";\nexport const releaseProbe=pgTable("release_probe",{id:integer("id").primaryKey(),kind:text("kind").notNull().default(RecordKind.Planner)});\n',
);
const configImport = relative(
  temp,
  resolve(root, "drizzle.config.ts"),
).replaceAll("\\", "/");
await writeFile(
  temp + "/drizzle.config.ts",
  `import base from ${JSON.stringify(configImport)};\nexport default {...base,schema:${JSON.stringify(folder + "/schema.ts")},out:${JSON.stringify(folder + "/generated")}};\n`,
);
const environment = { ...process.env };
delete environment.DATABASE_URL;
const result = spawnSync(
  process.execPath,
  [
    resolve(root, "node_modules/drizzle-kit/bin.cjs"),
    "generate",
    `--config=${folder}/drizzle.config.ts`,
  ],
  {
    cwd: root,
    env: environment,
    encoding: "utf8",
    timeout: 45000,
    maxBuffer: 2 * 1024 * 1024,
  },
);
assert.ok(
  !result.error && !result.signal,
  result.error?.message ?? result.signal,
);
assert.equal(result.status, 0, result.stderr + result.stdout);
const sqlFiles = (await readdir(temp + "/generated")).filter((f) =>
  f.endsWith(".sql"),
);
assert.equal(sqlFiles.length, 1);
const sql = await readFile(temp + "/generated/" + sqlFiles[0], "utf8");
assert.match(sql, /CREATE TABLE "release_probe"/);
assert.match(sql, /DEFAULT 'planner'/);
assert.ok(!/DROP TABLE/i.test(sql));
const report = {
  drizzleKit: "0.31.11",
  legacyLoaderEsbuildOverride: "0.25.12",
  typedConfigAndEnumImports: true,
  offlineSQLGenerated: true,
  databaseConnectionAttempted: false,
  realDatabaseVerified: false,
};
await writeFile(
  output + "/checks.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
