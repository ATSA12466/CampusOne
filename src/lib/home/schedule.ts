import type { TaskItem, TimetableSession } from "@/types/productivity";
import type { NextClass } from "@/types/home";
const zone = "Africa/Accra";
const campusFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: zone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function campusDate(now: Date) {
  if (!Number.isFinite(now.getTime())) throw new RangeError("A valid campus clock is required");
  const parts = campusFormatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function isCampusDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function minutes(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
export function nextClass(sessions: readonly TimetableSession[], now: Date): NextClass | null {
  const today = campusDate(now),
    midnight = Date.parse(`${today}T00:00:00Z`);
  const current = Math.floor((now.getTime() - midnight) / 60000);
  const day = new Date(midnight).getUTCDay();
  const candidates = sessions.flatMap((session) => {
    const start = minutes(session.start),
      end = minutes(session.end),
      weekday = weekdays.indexOf(session.day);
    if (weekday < 0 || start === null || end === null || end <= start) return [];
    let distance = (weekday - day + 7) % 7;
    if (distance === 0 && end <= current) distance = 7;
    const starts = midnight + (distance * 1440 + start) * 60000,
      ends = midnight + (distance * 1440 + end) * 60000;
    return [
      {
        session,
        date: new Date(starts).toISOString().slice(0, 10),
        startsAt: new Date(starts).toISOString(),
        endsAt: new Date(ends).toISOString(),
        inProgress: starts <= now.getTime() && ends > now.getTime(),
        minutesUntil: Math.max(0, Math.ceil((starts - now.getTime()) / 60000)),
      },
    ];
  });
  return (
    candidates.sort(
      (a, b) => Number(b.inProgress) - Number(a.inProgress) || a.startsAt.localeCompare(b.startsAt),
    )[0] ?? null
  );
}
export function taskSummary(tasks: readonly TaskItem[], now: Date) {
  const today = campusDate(now);
  const pending = tasks
    .filter((task) => !task.completed)
    .sort(
      (a, b) =>
        (isCampusDate(a.dueDate) ? a.dueDate : "9999").localeCompare(
          isCampusDate(b.dueDate) ? b.dueDate : "9999",
        ) || a.title.localeCompare(b.title),
    );
  const completed = tasks.filter((task) => task.completed).length;
  return {
    pending,
    completed,
    total: tasks.length,
    percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    overdue: pending.filter((task) => isCampusDate(task.dueDate) && task.dueDate < today).length,
    dueToday: pending.filter((task) => task.dueDate === today).length,
  };
}
export function relativeCampusDay(date: string, now: Date) {
  if (!isCampusDate(date)) return "Date unavailable";
  const days = Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${campusDate(now)}T00:00:00Z`)) / 86400000,
  );
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return new Intl.DateTimeFormat("en-GH", {
    timeZone: zone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00Z`));
}
