import test from "node:test";
import assert from "node:assert/strict";
const { campusDate, isCampusDate, nextClass, relativeCampusDay, taskSummary } = await import(
  "../../src/lib/home/schedule.ts"
);
const slot = (day, start = "09:00", end = "11:00", id = day) => ({
  id,
  day,
  start,
  end,
  course: "ITT341",
  venue: "Lab 2",
});
test("Accra clock uses campus date, rejects an invalid clock and validates leap/calendar dates", () => {
  assert.equal(campusDate(new Date("2026-10-12T00:15:00+02:00")), "2026-10-11");
  assert.throws(() => campusDate(new Date("bad")), RangeError);
  assert.equal(isCampusDate("2028-02-29"), true);
  for (const value of [
    undefined,
    "",
    "tomorrow",
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-1-2",
    "2026-10-12T00:00:00Z",
  ])
    assert.equal(isCampusDate(value), false, value);
});
test("next class sorts by real weekday/time rather than fixture order, without mutating", () => {
  const sessions = [slot("Thursday"), slot("Tuesday", "13:00", "15:00"), slot("Monday")];
  const result = nextClass(sessions, new Date("2026-10-11T12:00:00Z"));
  assert.equal(result.session.day, "Monday");
  assert.equal(result.date, "2026-10-12");
  assert.equal(result.minutesUntil, 1260);
  assert.equal(result.inProgress, false);
  assert.equal(sessions[0].day, "Thursday");
});
test("now/in-progress, exact start/end, overlapping slots and week rollover are deterministic", () => {
  const sessions = [slot("Monday")];
  for (const time of ["09:00", "10:59"])
    assert.equal(nextClass(sessions, new Date(`2026-10-12T${time}:00Z`)).inProgress, true);
  const end = nextClass(sessions, new Date("2026-10-12T11:00:00Z"));
  assert.equal(end.date, "2026-10-19");
  assert.equal(end.inProgress, false);
  assert.equal(
    nextClass(
      [slot("Monday", "09:00", "11:00", "first"), slot("Monday", "10:00", "12:00", "second")],
      new Date("2026-10-12T10:30:00Z"),
    ).session.id,
    "first",
  );
});
test("bad/empty timetable entries do not manufacture an actual next class", () => {
  const now = new Date("2026-10-11T12:00:00Z");
  for (const sessions of [
    [],
    [slot("Funday")],
    [slot("Monday", "25:00")],
    [slot("Monday", "11:00", "09:00")],
    [slot("Monday", "09:00", "09:00")],
  ])
    assert.equal(nextClass(sessions, now), null);
});
test("tasks distinguish overdue/today/done/no-date/invalid, sort safely and preserve original order", () => {
  const tasks = [
    { id: "none", title: "No date", completed: false },
    { id: "bad", title: "Bad", dueDate: "broken", completed: false },
    { id: "today", title: "Today", dueDate: "2026-10-11", completed: false },
    { id: "old", title: "Old", dueDate: "2026-10-10", completed: false },
    { id: "done", title: "Done", dueDate: "2026-10-09", completed: true },
  ];
  const result = taskSummary(tasks, new Date("2026-10-11T12:00:00Z"));
  assert.equal(result.overdue, 1);
  assert.equal(result.dueToday, 1);
  assert.equal(result.percent, 20);
  assert.equal(result.total, 5);
  assert.deepEqual(
    result.pending.map((task) => task.id),
    ["old", "today", "bad", "none"],
  );
  assert.equal(tasks[0].id, "none");
  assert.equal(taskSummary([], new Date()).percent, 0);
});
test("relative day labels handle UTC midnight boundaries and invalid persisted dates safely", () => {
  const now = new Date("2026-10-11T23:59:59Z");
  for (const [date, label] of [
    ["2026-10-11", "Today"],
    ["2026-10-12", "Tomorrow"],
    ["2026-10-10", "Yesterday"],
    ["2026-02-30", "Date unavailable"],
    ["broken", "Date unavailable"],
  ])
    assert.equal(relativeCampusDay(date, now), label);
  assert.match(relativeCampusDay("2026-10-15", now), /Thu/);
});
