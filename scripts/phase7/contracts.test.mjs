import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

test("Application AST has no any types or misplaced client boundaries", () => {
  const failures = [];
  function walk(dir) {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, f.name);
      if (f.isDirectory()) walk(file);
      else if (/\.tsx?$/.test(file)) {
        const text = fs.readFileSync(file, "utf8"),
          sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
        function visit(n) {
          if (n.kind === ts.SyntaxKind.AnyKeyword)
            failures.push(file + " any type");
          ts.forEachChild(n, visit);
        }
        visit(sf);
        const directives = [];
        for (const statement of sf.statements) {
          if (
            !ts.isExpressionStatement(statement) ||
            !ts.isStringLiteral(statement.expression)
          )
            break;
          directives.push(statement.expression.text);
        }
        const clientMention = sf.statements.some((statement) => {
          if (!ts.isExpressionStatement(statement)) return false;
          let expression = statement.expression;
          while (ts.isParenthesizedExpression(expression))
            expression = expression.expression;
          return (
            ts.isStringLiteral(expression) && expression.text === "use client"
          );
        });
        if (clientMention && !directives.includes("use client"))
          failures.push(file + " invalid client boundary");
      }
    }
  }
  walk("src");
  assert.deepEqual(failures, []);
});
test("Canonical task writes reject unrelated mutation failure, rather than false visit-only success", async (t) => {
  const rows = new Map(),
    storage = {
      getItem: (k) => rows.get(k) ?? null,
      setItem: (k, v) => rows.set(k, v),
      removeItem: (k) => rows.delete(k),
    },
    previous = ["window", "localStorage"].map((k) => [
      k,
      Object.getOwnPropertyDescriptor(globalThis, k),
    ]);
  for (const k of ["window", "localStorage"])
    Object.defineProperty(globalThis, k, {
      configurable: true,
      value: k === "window" ? { localStorage: storage } : storage,
    });
  try {
    const { useAuthStore: auth } = await import(
        "../../src/stores/auth-store.ts"
      ),
      { useAppStore: app } = await import("../../src/stores/app-store.ts"),
      { demoAuthService } = await import(
        "../../src/services/auth/demo-auth.service.ts"
      ),
      { taskActions } = await import(
        "../../src/services/tasks/task-actions.ts"
      );
    auth
      .getState()
      .setSession({ user: demoAuthService.initialUser(), source: "demo" });
    auth.getState().finishHydration();
    app.getState().resetDemo();
    const task = app.getState().tasks[0],
      original = app.setState;
    app.setState = () => {
      throw new Error("unrelated setter failure");
    };
    try {
      await t.test(
        "PUT verifies the complete desired record, not merely an existing ID",
        async () => {
          await assert.rejects(
            taskActions.put({ ...task, completed: true }),
            /could not be confirmed/,
          );
          assert.equal(app.getState().tasks[0].completed, false);
        },
      );
      await t.test(
        "DELETE verifies absence before reporting a removed task",
        async () => {
          await assert.rejects(
            taskActions.remove(task.id),
            /could not be confirmed/,
          );
          assert.ok(app.getState().tasks.some((t) => t.id === task.id));
        },
      );
    } finally {
      app.setState = original;
    }
  } finally {
    for (const [k, d] of previous) {
      if (d) Object.defineProperty(globalThis, k, d);
      else delete globalThis[k];
    }
  }
});
