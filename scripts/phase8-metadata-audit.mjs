import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { listScreens } from "./audit/routes.mjs";
const base = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3001",
  out = process.env.AUDIT_OUTPUT_DIR ?? ".cache/final/metadata";
await mkdir(out, { recursive: true });
const screens = [
    ...(await listScreens()),
    {
      pattern: "not-found",
      path: "/audit-route-does-not-exist",
      expectedStatus: 404,
    },
  ],
  records = [];
// Bot user-agent asks Next for complete, non-streamed metadata; no identity cookies.
for (const screen of screens) {
  const response = await fetch(base + screen.path, {
    headers: { "user-agent": "Twitterbot/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, screen.expectedStatus ?? 200, screen.path);
  const html = await response.text();
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1],
    description = html.match(
      /<meta name="description" content="([^"]+)"/s,
    )?.[1],
    ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/s)?.[1],
    ogDescription = html.match(
      /<meta property="og:description" content="([^"]+)"/s,
    )?.[1];
  assert.ok(title?.includes("CampusOne"), screen.path + " route title");
  assert.ok(description?.length >= 10, screen.path + " description");
  assert.ok(ogTitle?.includes("CampusOne"), screen.path + " OG title");
  assert.ok(ogDescription?.length >= 10, screen.path + " OG description");
  assert.ok(
    /<meta name="robots" content="[^"]*noindex/.test(html),
    screen.path + " demo privacy robots",
  );
  records.push({
    path: screen.path,
    status: response.status,
    title,
    description,
    ogTitle,
    ogDescription,
    demoNoindex: true,
  });
}
const health = await fetch(base + "/api/health");
assert.equal(health.status, 503);
assert.deepEqual(await health.json(), { ok: false });
await writeFile(
  out + "/checks.json",
  JSON.stringify(
    {
      records,
      healthWithoutConfiguredDB: { status: 503, ok: false },
      realDatabaseVerified: false,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Route titles/descriptions/OG/noindex passed:",
  records.length,
  "health 503 without DB verified",
);
