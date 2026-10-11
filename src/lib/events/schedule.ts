import type { EventItem } from "@/types";
import { isCampusDate, campusDate } from "@/lib/home/schedule";
const day = 86400000;
export function eventEnd(event: EventItem) {
  return event.details
    ? Date.parse(event.details.endsAt)
    : isCampusDate(event.date)
      ? Date.parse(`${event.date}T00:00:00Z`) + day
      : NaN;
}
export function eventStart(event: EventItem) {
  return event.details
    ? Date.parse(event.details.startsAt)
    : isCampusDate(event.date)
      ? Date.parse(`${event.date}T00:00:00Z`)
      : NaN;
}
export function eventPhase(event: EventItem, now: Date) {
  if (!Number.isFinite(now.getTime()) || !Number.isFinite(eventEnd(event))) return "unknown";
  if (event.details?.status === "cancelled") return "cancelled";
  if (eventEnd(event) <= now.getTime()) return "ended";
  if (eventStart(event) > now.getTime()) return "upcoming";
  return event.details ? "live" : "today";
}
export function eventCount(
  event: EventItem,
  going: boolean,
  source: "demo" | "api",
  attendance: readonly { eventId: string; registered: number }[] = [],
) {
  const reported =
    source === "api" ? attendance.find((item) => item.eventId === event.id)?.registered : undefined;
  return Math.min(
    event.seats,
    Math.max(0, reported ?? event.registered + (source === "demo" && going ? 1 : 0)),
  );
}
export function bookingState(event: EventItem, now: Date, count = event.registered) {
  const phase = eventPhase(event, now);
  if (phase === "cancelled" || phase === "ended" || phase === "unknown") return phase;
  if (event.details && Date.parse(event.details.bookingClosesAt) <= now.getTime()) return "closed";
  return count >= event.seats ? "full" : "available";
}
export function countdown(event: EventItem, now: Date) {
  const phase = eventPhase(event, now);
  if (phase === "cancelled") return "Event cancelled";
  if (phase === "ended") return "This event has ended";
  if (phase === "unknown") return "Schedule unavailable";
  if (phase === "live") return "Happening now";
  if (!event.details)
    return phase === "today" ? "Today · time not supplied" : "Start time not supplied";
  const total = Math.max(1, Math.ceil((eventStart(event) - now.getTime()) / 60000)),
    days = Math.floor(total / 1440),
    hours = Math.floor((total % 1440) / 60),
    minutes = total % 60;
  return `${days ? `${days}d ` : ""}${hours ? `${hours}h ` : ""}${minutes}m until it starts`;
}
export const eventDate = (event: EventItem) =>
  isCampusDate(event.date)
    ? new Intl.DateTimeFormat("en-GH", {
        timeZone: "Africa/Accra",
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${event.date}T12:00:00Z`))
    : "Date not supplied";
export function multiDay(event: EventItem) {
  return (
    !!event.details &&
    campusDate(new Date(event.details.startsAt)) !== campusDate(new Date(event.details.endsAt))
  );
}
export function dateAndTime(iso: string) {
  return `${new Intl.DateTimeFormat("en-GH", { timeZone: "Africa/Accra", weekday: "short", month: "short", day: "numeric" }).format(new Date(iso))}, ${timeLabel(iso)}`;
}
export const eventTime = (event: EventItem) =>
  event.details
    ? `${timeLabel(event.details.startsAt)} – ${multiDay(event) ? dateAndTime(event.details.endsAt) : timeLabel(event.details.endsAt)} · GMT`
    : "Time not supplied";
export const agendaTime = (event: EventItem, iso: string) =>
  multiDay(event) ? dateAndTime(iso) : timeLabel(iso);
export function timeLabel(iso: string) {
  const date = new Date(iso);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-GH", {
        timeZone: "Africa/Accra",
        hour: "numeric",
        minute: "2-digit",
      }).format(date)
    : "Time unavailable";
}
