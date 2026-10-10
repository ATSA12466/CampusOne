import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
// Node 22's native type stripping; aliases stay in test tooling, not application bundles.
registerHooks({
  resolve(specifier, context, nextResolve) {
    const alias = specifier.startsWith("@/");
    const relative = specifier.startsWith(".") && context.parentURL?.startsWith("file:");
    if (alias || relative) {
      const base = alias
        ? resolve(root, "src", specifier.slice(2))
        : resolve(dirname(fileURLToPath(context.parentURL)), specifier);
      const file = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find(
        (candidate) => existsSync(candidate) && /\.(ts|tsx|mjs|js)$/.test(candidate),
      );
      if (file)
        return {
          url: pathToFileURL(file).href,
          shortCircuit: true,
          ...(file.endsWith(".ts") ? { format: "module-typescript" } : {}),
        };
    }
    return nextResolve(specifier, context);
  },
});
