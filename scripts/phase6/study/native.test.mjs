import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  studyInputSchema,
  studyPlanSchema,
} from "../../../src/services/validation/study.schema.ts";
import { taskRecordSchema } from "../../../src/services/validation/task.schema.ts";
import {
  studySessions,
  nextStudyWeek,
} from "../../../src/lib/study/planner.ts";
import { taskIsOverdue } from "../../../src/lib/tasks/status.ts";
import { scheduleCalendar } from "../../../src/lib/schedule/calendar.ts";
const records = new Map();
globalThis.localStorage = {
  getItem: (k) => records.get(k) ?? null,
  setItem: (k, v) => records.set(k, v),
  removeItem: (k) => records.delete(k),
};
globalThis.window = { localStorage: globalThis.localStorage };
const { useAuthStore } = await import("../../../src/stores/auth-store.ts");
const { useAppStore } = await import("../../../src/stores/app-store.ts");
const { createWorkspaceService } = await import(
  "../../../src/services/workspace/workspace-actions.ts"
);
const { taskActions } = await import(
  "../../../src/services/tasks/task-actions.ts"
);
const { studyPlannerService } = await import(
  "../../../src/services/study/study-planner.service.ts"
);
const user = {
  id: "study-user",
  email: "study@campusone.demo",
  role: "student",
  name: "Study tester",
  programme: "IT",
  level: "Level 300",
};
const owner = () =>
  useAuthStore.setState({
    user,
    source: "demo",
    role: "student",
    hydrated: true,
  });
const input = {
  subject: "Software Engineering",
  weekStart: "2026-10-12",
  days: ["Monday", "Wednesday", "Friday"],
  start: "18:00",
  duration: "60",
  breakMinutes: "15",
  goal: "Mixed",
  constraints: "Find a quiet room; double-check official classes.",
};
const saved = () => ({
  ...input,
  id: "study-draft",
  createdAt: "2026-10-11T12:00:00Z",
  sessions: studySessions(input),
});
const task = {
  id: "task-new",
  title: "A focused study task",
  description: "Prepare a few useful questions.",
  dueDate: "2026-10-11",
  priority: "high",
  category: "academic",
  completed: false,
};
test("planner rejects invalid dates, no/duplicate availability, unsupported durations, overlong text and midnight overflow", () => {
  for (const patch of [
    { weekStart: "2026-02-30" },
    { days: [] },
    { days: ["Monday", "Monday"] },
    { duration: "30" },
    { subject: "x" },
    { constraints: "x".repeat(1001) },
    { start: "23:30" },
  ])
    assert.equal(
      studyInputSchema.safeParse({ ...input, ...patch }).success,
      false,
    );
});
test("structured availability/time/duration/breaks are honoured in chronological Accra sessions", () => {
  const sessions = studySessions(input);
  assert.deepEqual(
    sessions.map((s) => s.date),
    ["2026-10-12", "2026-10-14", "2026-10-16"],
  );
  assert.ok(
    sessions.every(
      (s) =>
        s.start === "18:00" && s.end === "19:00" && s.breakUntil === "19:15",
    ),
  );
});
test("seven-day windows cross a month/year without scheduling unavailable days", () => {
  const s = studySessions({
    ...input,
    weekStart: "2026-12-29",
    days: ["Wednesday", "Saturday"],
  });
  assert.deepEqual(
    s.map((v) => v.date),
    ["2026-12-30", "2027-01-02"],
  );
});
test("focus rotates truthfully; free-text constraints are retained as context and not falsely parsed as rules", () => {
  assert.deepEqual(
    studySessions(input).map((s) => s.focus),
    ["Revision", "Practice", "Recall & reflect"],
  );
  const v = studyInputSchema.parse({
    ...input,
    goal: "Practice",
    constraints: "Only study Tuesday",
  });
  assert.ok(studySessions(v).every((s) => s.focus === "Practice"));
  assert.equal(v.constraints, "Only study Tuesday");
  assert.equal(studySessions(v)[0].date, "2026-10-12");
});
test("stored draft schema rejects sessions inconsistent with its stated scheduling controls", () => {
  const plan = saved();
  studyPlanSchema.parse(plan);
  assert.equal(
    studyPlanSchema.safeParse({
      ...plan,
      sessions: plan.sessions.map((s) => ({ ...s, end: "22:00" })),
    }).success,
    false,
  );
});
test("generate service returns a validated deterministic draft without an AI transport request", async () => {
  const original = fetch;
  globalThis.fetch = () => {
    throw new Error("No AI transport expected");
  };
  try {
    const plan = await studyPlannerService.generate(input);
    assert.ok(plan.id);
    assert.deepEqual(plan.sessions, studySessions(input));
    assert.equal(plan.constraints, input.constraints);
  } finally {
    globalThis.fetch = original;
  }
});
test("saved study drafts persist idempotently, delete, and remain owner-qualified", async () => {
  owner();
  const s = createWorkspaceService();
  assert.equal((await s.put("studyPlans", saved())).persisted, true);
  await s.put("studyPlans", saved());
  assert.equal((await s.list("studyPlans")).length, 1);
  useAuthStore.setState({ user: { ...user, email: "other@campusone.demo" } });
  assert.deepEqual(await s.list("studyPlans"), []);
  owner();
  await s.remove("studyPlans", "study-draft");
  assert.deepEqual(await s.list("studyPlans"), []);
});
test("task title/date/ID bounds are shared; a task due today is not overdue until tomorrow in Accra", () => {
  taskRecordSchema.parse(task);
  assert.equal(taskIsOverdue(task, "2026-10-11"), false);
  assert.equal(taskIsOverdue(task, "2026-10-12"), true);
  assert.equal(
    taskIsOverdue({ ...task, completed: true }, "2026-10-12"),
    false,
  );
  assert.equal(
    taskRecordSchema.safeParse({ ...task, dueDate: "2026-02-30" }).success,
    false,
  );
  assert.equal(
    taskRecordSchema.safeParse({ ...task, id: "../bad" }).success,
    false,
  );
});
test("task desired updates/completion/deletion preserve canonical same-profile Home state and durable storage", async () => {
  owner();
  useAppStore.getState().resetDemo();
  assert.equal((await taskActions.put(task)).persisted, true);
  await taskActions.put({ ...task, completed: true });
  assert.equal(
    (await taskActions.list()).items.filter((t) => t.id === task.id).length,
    1,
  );
  assert.equal(
    useAppStore.getState().tasks.find((t) => t.id === task.id).completed,
    true,
  );
  assert.equal(
    JSON.parse(records.get("campusone-app")).state.tasks.find(
      (t) => t.id === task.id,
    ).completed,
    true,
  );
  await taskActions.remove(task.id);
  assert.ok(!useAppStore.getState().tasks.some((t) => t.id === task.id));
});
test("denied task storage retains verified visit-only canonical state without claiming durability", async () => {
  owner();
  const write = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error("Denied");
  };
  try {
    assert.equal((await taskActions.put(task)).persisted, false);
    assert.ok((await taskActions.list()).items.some((t) => t.id === task.id));
  } finally {
    localStorage.setItem = write;
  }
});
test("study export is real tentative UTC ICS with one event per selected day; next-week defaults use Accra UTC", () => {
  const s = studySessions(input),
    ics = scheduleCalendar(
      s.map((v) => ({
        id: v.date,
        date: v.date,
        start: v.start,
        end: v.end,
        title: input.subject,
        kind: "personal",
        label: "Deterministic study draft",
        venue: "Study space",
      })),
      "2026-10-11T12:00:00Z",
    );
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 3);
  assert.ok(ics.includes("DTSTART:20261012T180000Z"));
  assert.ok(ics.includes("DTEND:20261012T190000Z"));
  assert.equal(ics.match(/STATUS:TENTATIVE/g).length, 3);
  assert.equal(nextStudyWeek(new Date("2026-10-11T12:00:00Z")), "2026-10-12");
});
test("API task source has validated private reads/PUT/DELETE/credentials/no-store and rejects late role/abort completion", () => {
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
