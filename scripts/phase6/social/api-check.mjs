import "../../foundation/load-typescript.mjs";
import assert from "node:assert/strict";
const { useAuthStore } = await import("../../../src/stores/auth-store.ts");
const { useAppStore } = await import("../../../src/stores/app-store.ts");
const { notificationActions } = await import(
  "../../../src/services/notifications/notification-actions.ts"
);
const user = {
  id: "api-social",
  email: "api-social@campusone.demo",
  name: "API social test",
  role: "student",
  programme: "IT",
  level: "Level 300",
};
useAuthStore.setState({ user, source: "api", role: "student", hydrated: true });
const before = useAppStore.getState().notifications;
let calls = 0;
globalThis.fetch = async (url, init) => {
  calls++;
  assert.equal(url, "http://127.0.0.1:4000/api/notifications/read");
  assert.equal(init.method, "PUT");
  assert.equal(init.credentials, "include");
  assert.equal(init.cache, "no-store");
  assert.deepEqual(JSON.parse(init.body), { ids: ["n1"] });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
assert.equal((await notificationActions.read(["n1"])).persisted, true);
assert.equal(calls, 1);
assert.equal(useAppStore.getState().notifications, before);
globalThis.fetch = async () =>
  new Response(JSON.stringify({ ok: false }), { status: 200 });
await assert.rejects(notificationActions.read(["n1"]));
globalThis.fetch = async () => {
  useAuthStore.setState({ role: "administrator" });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
await assert.rejects(notificationActions.read(["n1"]), /account changed/);
useAuthStore.setState({ role: "student" });
const abort = new AbortController();
abort.abort();
await assert.rejects(
  notificationActions.read(["n1"], { signal: abort.signal }),
);
await assert.rejects(notificationActions.read(Array(201).fill("n1")));
console.log(
  "API notification encoding/credentials/no-store/ack/role/abort/count boundary passed; no deployment proof",
);

const late = new AbortController();
globalThis.fetch = async () => {
  late.abort();
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
await assert.rejects(notificationActions.read(["n1"], { signal: late.signal }));
