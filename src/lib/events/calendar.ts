import type { EventItem } from "@/types";
import { isCampusDate } from "@/lib/home/schedule";
import { escape, fold, utc } from "@/lib/schedule/ics-format";
export function eventCalendar(
  event: EventItem,
  source: "demo" | "api",
  generatedAt: string,
) {
  if (!isCampusDate(event.date))
    throw new Error("This event has no valid calendar date.");
  const next = new Date(Date.parse(`${event.date}T00:00:00Z`) + 86400000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const dateLines = event.details
    ? [
        `DTSTART:${utc(event.details.startsAt)}`,
        `DTEND:${utc(event.details.endsAt)}`,
      ]
    : [
        `DTSTART;VALUE=DATE:${event.date.replace(/-/g, "")}`,
        `DTEND;VALUE=DATE:${next}`,
      ];
  if (
    event.details &&
    Date.parse(event.details.endsAt) <= Date.parse(event.details.startsAt)
  )
    throw new Error("This event has an invalid calendar duration.");
  const description = [
    ...(event.details?.description ?? []),
    source === "demo"
      ? "Fictional CampusOne demo event. Not an official invitation or entry credential."
      : "Exported from a CampusOne listing. Verify schedule changes with its organizer.",
  ].join("\n\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CampusOne//Student event calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${source === "demo" ? "demo-" : "api-"}${encodeURIComponent(event.id)}@campusone.local`,
    `DTSTAMP:${utc(generatedAt)}`,
    ...dateLines,
    `SUMMARY:${escape(`${source === "demo" ? "DEMO: " : ""}${event.title}`)}`,
    `LOCATION:${escape(event.venue)}`,
    `DESCRIPTION:${escape(description)}`,
    `STATUS:${event.details?.status === "cancelled" ? "CANCELLED" : source === "demo" || !event.details ? "TENTATIVE" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return {
    filename: `campusone-${source === "demo" ? "demo-" : ""}${event.id.replace(/[^a-zA-Z0-9.-]/g, "_").slice(0, 80)}.ics`,
    content: lines.map(fold).join("\r\n") + "\r\n",
  };
}
