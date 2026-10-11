import { campusDate, isCampusDate } from "@/lib/home/schedule";
import type { DiscoverItem } from "@/types/discover";
export function discoverStatus(item: DiscoverItem, now: Date) {
  if (!Number.isFinite(now.getTime())) return "Schedule unavailable";
  if (item.event) {
    const event = item.event;
    if (event.cancelled) return "Cancelled";
    const end = event.endsAt
      ? Date.parse(event.endsAt)
      : Date.parse(`${event.date}T00:00:00Z`) + 86400000;
    if (end <= now.getTime()) return "Event ended";
    if (event.full) return "Fully booked";
    if (event.closesAt && Date.parse(event.closesAt) <= now.getTime())
      return "Bookings closed";
    if (event.startsAt && Date.parse(event.startsAt) <= now.getTime())
      return "Happening now";
    return "Explore & RSVP";
  }
  if (item.category === "opportunities" && isCampusDate(item.date))
    return item.date < campusDate(now)
      ? "Deadline passed"
      : item.date === campusDate(now)
        ? "Deadline today"
        : "Explore opportunity";
  if (item.destination === "board") return "Shared board";
  if (item.destination === "library") return "Media library";
  return "Explore listing";
}
