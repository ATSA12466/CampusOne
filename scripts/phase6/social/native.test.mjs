import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { useAuthStore } from "../../../src/stores/auth-store.ts";
import { useAppStore } from "../../../src/stores/app-store.ts";
import { createWorkspaceService } from "../../../src/services/workspace/workspace-actions.ts";
import { entitySchemas } from "../../../src/services/validation/catalog.schemas.ts";
import {
  postRecordSchema,
  replyRecordSchema,
  messageSchema,
  concernSchema,
} from "../../../src/services/validation/social.schema.ts";
import { demoCatalog } from "../../../src/services/demo/catalog.service.ts";
import { notificationActions } from "../../../src/services/notifications/notification-actions.ts";
import {
  clearPrivateWorkspace,
  privateWorkspaceKey,
} from "../../../src/lib/workspace/storage.ts";
const records = new Map();
globalThis.localStorage = {
  getItem: (k) => records.get(k) ?? null,
  setItem: (k, v) => records.set(k, v),
  removeItem: (k) => records.delete(k),
};
const user = {
  id: "social-user",
  email: "social@campusone.demo",
  name: "Social tester",
  role: "student",
  programme: "IT",
  level: "Level 300",
};
const session = (source = "demo", u = user, role = "student") =>
  useAuthStore.setState({ user: u, source, role, hydrated: true });
const post = {
  id: "owned-post",
  body: "A useful private update for my project team.",
  topic: "Study",
  author: user.name,
  createdAt: "2026-10-11T12:00:00Z",
};
test("public social sources preserve p1/p2/c1/c2/n1/n2 and expand to 12 stories/6 conversations/12 updates with safe DTOs", async () => {
  for (const [collection, count] of [
    ["posts", 12],
    ["conversations", 6],
    ["notifications", 12],
  ]) {
    const page = await demoCatalog.list(collection, { pageSize: 30 });
    assert.equal(page.total, count);
    for (const item of page.items) entitySchemas[collection].parse(item);
  }
  assert.ok((await demoCatalog.get("posts", "p1")).body.includes("Python"));
  assert.ok(await demoCatalog.get("conversations", "c2"));
  assert.ok(await demoCatalog.get("notifications", "n1"));
  const n = await demoCatalog.get("notifications", "n1");
  assert.equal(
    entitySchemas.notifications.safeParse({ ...n, href: "javascript:alert(1)" })
      .success,
    false,
  );
});
test("social bodies, reactions, replies, concerns and photos have bounded safe schemas and no executable attachment sources", () => {
  postRecordSchema.parse(post);
  replyRecordSchema.parse({
    id: "reply1",
    postId: "p1",
    author: user.name,
    body: "A useful reply.",
    createdAt: post.createdAt,
  });
  for (const change of [
    { body: "x" },
    { body: "x".repeat(3001) },
    { id: "../bad" },
    { photo: "data:text/html;base64,aA==" },
  ])
    assert.equal(
      postRecordSchema.safeParse({ ...post, ...change }).success,
      false,
    );
  assert.equal(
    messageSchema.safeParse({
      id: "m1",
      conversationId: "c1",
      author: "you",
      body: "",
      createdAt: post.createdAt,
    }).success,
    false,
  );
  assert.equal(
    concernSchema.safeParse({
      id: "c1",
      targetId: "p1",
      area: "community",
      reason: "spam",
      note: "x",
      createdAt: post.createdAt,
    }).success,
    false,
  );
});
test("private updates, threaded replies and message photo attachments persist only for their owner and are replace/delete idempotent", async () => {
  session();
  const s = createWorkspaceService();
  await s.put("communityPosts", post);
  await s.put("communityPosts", post);
  assert.equal((await s.list("communityPosts")).length, 1);
  await s.put("replies", {
    id: "reply-1",
    postId: post.id,
    author: user.name,
    body: "Reply to my update.",
    createdAt: post.createdAt,
  });
  await s.put("replies", {
    id: "reply-2",
    postId: post.id,
    parentId: "reply-1",
    author: user.name,
    body: "A nested reply.",
    createdAt: post.createdAt,
  });
  assert.equal(
    (await s.list("replies")).find((r) => r.id === "reply-2").parentId,
    "reply-1",
  );
  await s.put("messages", {
    id: "msg1",
    conversationId: "c1",
    author: "you",
    body: "A local message with an owned photo.",
    createdAt: post.createdAt,
    photo: "data:image/jpeg;base64,aGVsbG8=",
  });
  assert.equal((await s.list("messages")).length, 1);
  session("demo", { ...user, email: "other@campusone.demo" });
  assert.deepEqual(await s.list("messages"), []);
  session();
  await s.remove("communityPosts", post.id);
  assert.deepEqual(await s.list("communityPosts"), []);
});
test("one desired reaction per post toggles without manufactured repeat count increments", async () => {
  session();
  const s = createWorkspaceService();
  const reaction = { id: "p1", postId: "p1", kind: "like" };
  await s.put("reactions", reaction);
  await s.put("reactions", reaction);
  assert.equal(
    (await s.list("reactions")).filter((r) => r.postId === "p1").length,
    1,
  );
  await s.remove("reactions", "p1");
  assert.deepEqual(await s.list("reactions"), []);
});
test("notification reads preserve canonical header/store state, reject unknown IDs and have verified visit-only semantics", async () => {
  session();
  useAppStore.getState().resetDemo();
  const original = useAppStore.getState().notifications;
  await notificationActions.read(["n1"]);
  assert.equal(
    useAppStore.getState().notifications.find((n) => n.id === "n1").read,
    true,
  );
  assert.equal(useAppStore.getState().notifications.length, original.length);
  await assert.rejects(notificationActions.read(["unknown"]), /no longer/);
  const save = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error("Denied");
  };
  try {
    assert.equal((await notificationActions.read(["n2"])).persisted, false);
    assert.equal(
      useAppStore.getState().notifications.find((n) => n.id === "n2").read,
      true,
    );
  } finally {
    localStorage.setItem = save;
  }
});
test("API workspace late role/owner changes cannot produce success or populate local social state", async () => {
  session("api");
  const original = fetch;
  globalThis.fetch = async () => {
    session("api", user, "administrator");
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  try {
    await assert.rejects(
      createWorkspaceService("api").put("messages", {
        id: "api-m1",
        conversationId: "c1",
        author: "you",
        body: "API message.",
        createdAt: post.createdAt,
      }),
      /account changed/,
    );
    assert.ok(
      ![...records.keys()].some((k) => k.startsWith("campusone-workspace:api")),
    );
  } finally {
    globalThis.fetch = original;
    session();
  }
});
test("workspace capacity rejects record 201 instead of silently discarding an older record", async () => {
  session();
  const s = createWorkspaceService();
  for (let i = 0; i < 200; i++)
    await s.put("reactions", {
      id: `cap${i}`,
      postId: `cap${i}`,
      kind: "like",
    });
  await assert.rejects(
    s.put("reactions", { id: "overflow", postId: "overflow", kind: "like" }),
    /full/,
  );
  assert.equal((await s.list("reactions")).length, 200);
  await s.remove("reactions", "cap0");
  await s.put("reactions", {
    id: "replacement",
    postId: "replacement",
    kind: "like",
  });
});
test("workspace cleanup reports denied durable deletion rather than falsely claiming all device data is gone", async () => {
  session();
  const s = createWorkspaceService();
  await s.put("communityPosts", post);
  const remove = localStorage.removeItem;
  localStorage.removeItem = () => {
    throw new Error("Denied");
  };
  try {
    assert.equal(clearPrivateWorkspace("demo", user), false);
  } finally {
    localStorage.removeItem = remove;
    records.delete(privateWorkspaceKey("demo", user) + ":communityPosts");
  }
});
test("external durable deletion cannot resurrect cached records; denied-write updates retain newer visit-only data", async () => {
  session();
  const s = createWorkspaceService();
  await s.put("conversations", {
    id: "cross-tab",
    name: "Private team",
    createdAt: post.createdAt,
  });
  const key = privateWorkspaceKey("demo", user) + ":conversations";
  records.delete(key);
  assert.deepEqual(await s.list("conversations"), []);
  await s.put("conversations", {
    id: "cross-tab",
    name: "Old durable name",
    createdAt: post.createdAt,
  });
  const save = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error("Denied");
  };
  try {
    assert.equal(
      (
        await s.put("conversations", {
          id: "cross-tab",
          name: "New visit-only name",
          createdAt: post.createdAt,
        })
      ).persisted,
      false,
    );
    assert.equal(
      (await s.list("conversations"))[0].name,
      "New visit-only name",
    );
  } finally {
    localStorage.setItem = save;
  }
});

test("API notification contract has credentials/no-store, strict acknowledgements and role/abort bounds without demo fallback", () => {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./api-check.mjs", import.meta.url))],
    {
      env: { ...process.env, NEXT_PUBLIC_DATA_SOURCE: "api" },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
