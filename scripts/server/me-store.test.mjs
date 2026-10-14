import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.CAMPUSONE_DATA_DIR = mkdtempSync(join(tmpdir(), "campusone-mestore-"));
const { resetStoreCache } = await import("../../src/server/store.ts");
const { listMine, putMine, removeMine, MeStoreError } = await import(
  "../../src/server/me-store.ts"
);
const { campus } = await import("../../src/server/campus.ts");
resetStoreCache();

const user = "u_alice";
const other = "u_bob";

test("tasks validate, upsert and scope per user", async () => {
  const item = {
    id: "t1",
    title: "Read chapter 4",
    priority: "high",
    category: "academic",
    completed: false,
  };
  const saved = await putMine(user, "tasks", item);
  assert.equal(saved.title, "Read chapter 4");
  const again = await putMine(user, "tasks", { ...item, completed: true });
  assert.equal(again.completed, true);
  assert.equal(listMine(user, ["tasks"]).length, 1);
  assert.equal(listMine(other, ["tasks"]).length, 0);
  assert.equal(await removeMine(other, "tasks", "t1"), false);
  assert.equal(await removeMine(user, "tasks", "t1"), true);
  assert.equal(listMine(user, ["tasks"]).length, 0);
});

test("invalid items are rejected per collection schema", async () => {
  await assert.rejects(
    putMine(user, "tasks", { id: "bad", title: "x", priority: "urgent" }),
    (error) => error instanceof MeStoreError && error.status === 400,
  );
  await assert.rejects(
    putMine(user, "notes", { id: "n1", course: "CS", title: "No", body: "short" }),
    (error) => error instanceof MeStoreError && error.status === 400,
  );
  await assert.rejects(
    putMine(user, "grades", { id: "g1", course: "CS101", term: "Fall", credits: 3, points: 9 }),
    (error) => error instanceof MeStoreError && error.status === 400,
  );
});

test("notes, grades, sessions and plans round-trip", async () => {
  await putMine(user, "notes", {
    id: "n1",
    course: "CS 101",
    title: "Lecture 1",
    body: "Big ideas from the first lecture.",
    createdAt: new Date().toISOString(),
  });
  await putMine(user, "grades", {
    id: "g1",
    course: "CS 101",
    term: "Fall 2026",
    credits: 3,
    points: 3.5,
  });
  await putMine(user, "sessions", {
    id: "s1",
    day: "Monday",
    course: "CS 101",
    start: "09:00",
    end: "10:30",
    venue: "Room A",
  });
  await putMine(user, "plans", {
    id: "p1",
    title: "Study group",
    date: "2026-10-20",
    start: "14:00",
    end: "15:00",
    venue: "Library",
  });
  assert.equal(listMine(user, ["notes", "grades", "sessions", "plans"]).length, 4);
  assert.equal(listMine(user, ["notes"])[0].item.title, "Lecture 1");
});

test("oversized photos are rejected", async () => {
  const big = `data:image/jpeg;base64,${"a".repeat(720001)}`;
  await assert.rejects(
    putMine(user, "reports", {
      id: "r1",
      title: "Lost bag",
      description: "A detailed description of the lost item here.",
      category: "Bags",
      location: "Library",
      priceValue: 0,
      type: "lost",
      photo: big,
      createdAt: new Date().toISOString(),
      status: "open",
    }),
    (error) => error instanceof MeStoreError && error.status === 400,
  );
});

test("extended save kinds toggle without touching club/event saves", async () => {
  await campus.setSaved(user, "listing", "marketplace:mk1", true);
  await campus.setSaved(user, "media", "m1", true);
  await campus.setSaved(user, "club", "club-1", true);
  assert.deepEqual(campus.userSaves(user, "listing"), ["marketplace:mk1"]);
  assert.deepEqual(campus.userSaves(user, "media"), ["m1"]);
  assert.deepEqual(campus.userSaves(user, "club"), ["club-1"]);
  await campus.setSaved(user, "listing", "marketplace:mk1", false);
  assert.deepEqual(campus.userSaves(user, "listing"), []);
});
