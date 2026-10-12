import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ts from "typescript";
const files = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n"),
  forbidden = files.filter((f) =>
    /(^|\/)(\.next|node_modules|\.cache|\.git-credentials|\.netrc)(\/|$)|(^|\/)\.env(?:\.|$)/.test(
      f,
    ),
  );
assert.deepEqual(
  forbidden,
  [],
  "Secrets/build/dependency artifacts must not be versioned",
);
const problems = [],
  counts = { typescriptFiles: 0 };
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (/\.tsx?$/.test(file)) {
      const text = fs.readFileSync(file, "utf8"),
        ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
      counts.typescriptFiles++;
      const ui = /^src\/(features|components)\//.test(file);
      function visit(node) {
        if (node.kind === ts.SyntaxKind.AnyKeyword)
          problems.push({ file, issue: "any type" });
        if (
          ui &&
          ts.isImportDeclaration(node) &&
          ts.isStringLiteral(node.moduleSpecifier) &&
          /(data\/demo|services\/demo)/.test(node.moduleSpecifier.text)
        )
          problems.push({ file, issue: "UI fixture import" });
        ts.forEachChild(node, visit);
      }
      visit(ast);
      if (ui && /#[\da-fA-F]{3,8}\b/.test(text))
        problems.push({ file, issue: "Literal component palette" });
    }
  }
}
walk("src");
assert.deepEqual(problems, []);
const pkg = JSON.parse(fs.readFileSync("package.json"));
assert.equal(pkg.name, "campusone-web");
const report = {
  typescriptFiles: counts.typescriptFiles,
  anyTypes: 0,
  UIFixtureImports: 0,
  literalComponentColors: 0,
  versionedForbiddenArtifacts: [],
  packageName: pkg.name,
  realBackendVerified: false,
};
const output = process.env.AUDIT_OUTPUT_DIR ?? ".cache/final/source";
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(
  output + "/checks.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
