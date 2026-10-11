import "../../foundation/load-typescript.mjs";
import assert from "node:assert/strict";
const { useAuthStore } = await import("../../../src/stores/auth-store.ts");
const { useAppStore } = await import("../../../src/stores/app-store.ts");
const { taskActions } = await import(
  "../../../src/services/tasks/task-actions.ts"
);
const user = {
  id: "api-studies",
  email: "api-studies@campusone.demo",
  name: "API studies test",
  role: "student",
  programme: "IT",
  level: "Level 300",
};
useAuthStore.setState({ user, source: "api", role: "student", hydrated: true });
const task = {
  id: "api-task",
  title: "API-owned task",
  dueDate: "2026-10-12",
  priority: "high",
  category: "academic",
  completed: false,
};
const before = useAppStore.getState().tasks,
  calls = [];
globalThis.fetch = async (url, init) => {
  calls.push({ url, init });
  assert.equal(init.credentials, "include");
  assert.equal(init.cache, "no-store");
  return new Response(JSON.stringify(init.method ? { ok: true } : [task]), {
    status: 200,
  });
};
assert.deepEqual((await taskActions.list()).items, [task]);
await taskActions.put(task);
await taskActions.remove(task.id);
assert.equal(calls[1].url, "http://127.0.0.1:4000/api/tasks/api-task");
assert.equal(calls[1].init.method, "PUT");
assert.deepEqual(JSON.parse(calls[1].init.body), task);
assert.equal(calls[2].init.method, "DELETE");
assert.equal(useAppStore.getState().tasks, before);
globalThis.fetch = async () => {
  useAuthStore.setState({ role: "administrator" });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
await assert.rejects(taskActions.put(task), /account changed/);
useAuthStore.setState({ role: "student" });
const late = new AbortController();
globalThis.fetch = async () => {
  late.abort();
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
await assert.rejects(taskActions.put(task, { signal: late.signal }));
globalThis.fetch = async () =>
  new Response(JSON.stringify([{ ...task, dueDate: "wrong" }]), {
    status: 200,
  });
await assert.rejects(taskActions.list());
console.log("API studies private task contract passed; no real backend proof");
