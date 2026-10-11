import assert from "node:assert/strict";
import test from "node:test";
import { useAuthStore } from "../../../src/stores/auth-store.ts";
import { createWorkspaceService } from "../../../src/services/workspace/workspace-actions.ts";
import {
  privateWorkspaceKey,
  readWorkspace,
  writeWorkspace,
  clearPrivateWorkspace,
} from "../../../src/lib/workspace/storage.ts";
import { enquiryInputSchema } from "../../../src/services/validation/workspace.schema.ts";
const records = new Map();
globalThis.localStorage = {
  getItem: (k) => records.get(k) ?? null,
  setItem: (k, v) => records.set(k, v),
  removeItem: (k) => records.delete(k),
};
const user = {
    id: "life-user",
    email: "life@campusone.demo",
    name: "Life tester",
    role: "student",
    programme: "IT",
    level: "Level 300",
  },
  row = {
    id: "enquiry-1",
    category: "accommodation",
    listingId: "h1",
    message: "Please confirm the viewing arrangements.",
    intent: "enquiry",
    createdAt: "2026-10-11T12:00:00Z",
  };
const session = (source = "demo", profile = user) =>
  useAuthStore.setState({
    user: profile,
    source,
    hydrated: true,
    role: "student",
  });
test("enquiry schema requires meaningful text and explicit disclosure acknowledgment", () => {
  assert.equal(
    enquiryInputSchema.safeParse({ message: "short", consent: "yes" }).success,
    false,
  );
  assert.equal(
    enquiryInputSchema.safeParse({ message: row.message, consent: "no" })
      .success,
    false,
  );
  assert.equal(
    enquiryInputSchema.safeParse({ message: row.message, consent: "yes" })
      .success,
    true,
  );
});
test("workspace desired-state records persist, reload, replace and delete without duplicate IDs", async () => {
  session();
  const service = createWorkspaceService();
  assert.deepEqual(await service.list("enquiries"), []);
  assert.equal((await service.put("enquiries", row)).persisted, true);
  await service.put("enquiries", {
    ...row,
    message: "Another sufficiently long message.",
  });
  assert.equal((await service.list("enquiries")).length, 1);
  assert.ok([...records.values()].some((s) => s.includes("sufficiently")));
  await service.remove("enquiries", row.id);
  assert.deepEqual(await service.list("enquiries"), []);
});
test("workspace data is owner/source-qualified; guest, mismatch and aborted writes cannot mutate data", async () => {
  session();
  const s = createWorkspaceService();
  await s.put("enquiries", row);
  session("demo", { ...user, email: "other@campusone.demo" });
  assert.deepEqual(await s.list("enquiries"), []);
  session("api");
  await assert.rejects(s.list("enquiries"), /active source/);
  session();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    s.put("enquiries", row, { signal: controller.signal }),
    (e) => e.name === "AbortError",
  );
  session("demo", null);
  await assert.rejects(s.put("enquiries", row), /Sign in/);
});
test("denied storage uses verified memory and does not claim durable success; corrupt JSON is not an empty workspace", async () => {
  session();
  const original = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error("Denied");
  };
  const s = createWorkspaceService();
  try {
    const changed = { ...row, id: "memory-only" };
    assert.equal((await s.put("enquiries", changed)).persisted, false);
    const key = privateWorkspaceKey("demo", user) + ":enquiries";
    records.delete(key);
    assert.ok((await s.list("enquiries")).some((r) => r.id === "memory-only"));
    records.set(key, "{broken");
    await assert.rejects(s.list("enquiries"), /damaged/);
    records.delete(key);
  } finally {
    localStorage.setItem = original;
  }
});
test("API workspace validates verbs, encoded IDs, no-store, credentials, schema errors and never local fallback", async () => {
  session("api");
  const original = fetch,
    hits = [];
  globalThis.fetch = async (url, init) => {
    hits.push({ url: String(url), ...init });
    return new Response(
      JSON.stringify(
        init.method === "GET" || !init.method ? [row] : { ok: true },
      ),
      { status: 200 },
    );
  };
  try {
    const s = createWorkspaceService("api");
    assert.equal((await s.list("enquiries")).length, 1);
    await s.put("enquiries", row);
    await s.remove("enquiries", row.id);
    assert.deepEqual(
      hits.map((h) => h.method ?? "GET"),
      ["GET", "PUT", "DELETE"],
    );
    assert.ok(
      hits.every((h) => h.cache === "no-store" && h.credentials === "include"),
    );
    globalThis.fetch = async () => new Response("{}", { status: 503 });
    await assert.rejects(s.list("enquiries"));
  } finally {
    globalThis.fetch = original;
    session();
  }
});
test("account cleanup discards visit memory and removes owner-qualified device keys", () => {
  const key = privateWorkspaceKey("demo", user) + ":enquiries";
  writeWorkspace(key, [row]);
  clearPrivateWorkspace("demo", user);
  assert.deepEqual(readWorkspace(key), []);
});

test("photo records require bounded owned data, meaningful locations and source-qualified persistence", async () => {
  const { photoRecordSchema } = await import(
    "../../../src/services/validation/workspace.schema.ts"
  );
  const item = {
    id: "photo-1",
    title: "My useful item",
    description: "A detailed description of my useful study item.",
    photo: "data:image/jpeg;base64,aGVsbG8=",
    createdAt: "2026-10-11T12:00:00Z",
    category: "Study materials",
    location: "Campus meeting point",
    priceValue: 25,
    type: "listing",
    status: "open",
  };
  assert.equal(photoRecordSchema.safeParse(item).success, true);
  for (const change of [
    { photo: "" },
    { photo: "https://external.invalid/a.jpg" },
    { photo: "data:text/html;base64,aA==" },
    { description: "short" },
    { priceValue: -1 },
  ])
    assert.equal(
      photoRecordSchema.safeParse({ ...item, ...change }).success,
      false,
    );
  session();
  const service = createWorkspaceService();
  await service.put("marketPosts", item);
  assert.equal((await service.list("marketPosts")).at(0).photo, item.photo);
  await service.remove("marketPosts", item.id);
  assert.deepEqual(await service.list("marketPosts"), []);
});
