import type { TimetableSession, EventItem } from "@/types";
import type { AgendaItem, PersonalPlan } from "@/types/schedule";
export const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export const dateAdd = (date: string, n: number) =>
  new Date(Date.parse(`${date}T12:00:00Z`) + n * 86400000)
    .toISOString()
    .slice(0, 10);
export function weekStart(date: string) {
  const d = new Date(`${date}T12:00:00Z`).getUTCDay();
  return dateAdd(date, -((d + 6) % 7));
}
export function monthDays(date: string) {
  const first = date.slice(0, 7) + "-01",
    start = weekStart(first);
  return Array.from({ length: 42 }, (_, n) => dateAdd(start, n));
}
export function overlaps(
  a: { start: string; end: string },
  b: { start: string; end: string },
) {
  return a.start < b.end && b.start < a.end;
}
export function classConflicts(rows: readonly TimetableSession[]) {
  return rows.flatMap((a, i) =>
    rows
      .slice(i + 1)
      .filter((b) => a.day === b.day && overlaps(a, b))
      .map((b) => [a.id, b.id]),
  );
}
export function weeklyAgenda(
  rows: readonly TimetableSession[],
  dates: readonly string[],
  label: string,
): AgendaItem[] {
  return dates.flatMap((date) => {
    const day = days[(new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7];
    return rows
      .filter((r) => r.day === day)
      .map((r) => ({
        id: `${r.id}-${date}`,
        title: r.course,
        date,
        start: r.start,
        end: r.end,
        venue: r.venue,
        kind: "class" as const,
        label,
      }));
  });
}
export function eventsAgenda(
  events: readonly EventItem[],
  label: string,
): AgendaItem[] {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.details
      ? new Date(e.details.startsAt).toISOString().slice(0, 10)
      : e.date,
    start: e.details
      ? new Date(e.details.startsAt).toISOString().slice(11, 16)
      : undefined,
    end: e.details
      ? new Date(e.details.endsAt).toISOString().slice(11, 16)
      : undefined,
    venue: e.venue,
    kind: "event",
    startsAt: e.details?.startsAt,
    endsAt: e.details?.endsAt,
    cancelled: e.details?.status === "cancelled",
    label: e.details?.status === "cancelled" ? `Cancelled · ${label}` : label,
    href: `/events/${encodeURIComponent(e.id)}`,
  }));
}
export const plansAgenda = (plans: readonly PersonalPlan[]): AgendaItem[] =>
  plans.map((p) => ({ ...p, kind: "personal", label: "Your personal plan" }));
export const sortAgenda = (rows: readonly AgendaItem[]) =>
  [...rows].sort((a, b) =>
    `${a.date} ${a.start ?? "00:00"}`.localeCompare(
      `${b.date} ${b.start ?? "00:00"}`,
    ),
  );

export const monthShift = (date: string, n: number) => {
  const [year, month] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + n, 1, 12))
    .toISOString()
    .slice(0, 10);
};
