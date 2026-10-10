import assert from "node:assert/strict";
import { createServer } from "node:http";

// A short-lived contract fixture, not a real CampusOne backend or database.
const base = process.env.AUDIT_PROD_BASE_URL ?? "http://127.0.0.1:3001";
const server = createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.url !== "/api/proxy-proof") {
    response.writeHead(404);
    response.end('{"fixture":true}');
    return;
  }
  response.setHeader("Set-Cookie", "campusone-fixture=1; HttpOnly; Path=/api; SameSite=Lax");
  response.end(JSON.stringify({ fixture: true, port: 4000, path: request.url }));
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(4000, "0.0.0.0", resolve);
});
try {
  const response = await fetch(`${base}/api/proxy-proof`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { fixture: true, port: 4000, path: "/api/proxy-proof" });
  assert.ok(response.headers.get("set-cookie").includes("HttpOnly"));
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 503);
  assert.deepEqual(await health.json(), { ok: false });
  console.log(
    "Verified same-origin /api → fixture port 4000, cookie forwarding, and unchanged missing-DB health 503. Real API/DB connectivity not asserted.",
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
}
