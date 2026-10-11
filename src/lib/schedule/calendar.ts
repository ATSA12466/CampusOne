import { dateAdd } from "./agenda";
import { escape, fold, utc } from "./ics-format";
import type { AgendaItem } from "@/types/schedule";
export function scheduleCalendar(rows: readonly AgendaItem[], now: string) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CampusOne//Personal schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...rows.flatMap((r) => [
      "BEGIN:VEVENT",
      `UID:${encodeURIComponent(r.kind + "-" + r.id)}@campusone.local`,
      `DTSTAMP:${utc(now)}`,
      ...(r.startsAt && r.endsAt
        ? [`DTSTART:${utc(r.startsAt)}`, `DTEND:${utc(r.endsAt)}`]
        : r.start && r.end
          ? [
              `DTSTART:${utc(r.date + "T" + r.start + ":00Z")}`,
              `DTEND:${utc(r.date + "T" + r.end + ":00Z")}`,
            ]
          : [
              `DTSTART;VALUE=DATE:${r.date.replace(/-/g, "")}`,
              `DTEND;VALUE=DATE:${dateAdd(r.date, 1).replace(/-/g, "")}`,
            ]),
      `SUMMARY:${escape(r.title)}`,
      `LOCATION:${escape(r.venue)}`,
      `DESCRIPTION:${escape(r.label + " · Exported personal planning snapshot. Verify all official schedules separately.")}`,
      `STATUS:${r.cancelled ? "CANCELLED" : "TENTATIVE"}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
