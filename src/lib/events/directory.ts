import type { EventItem, EventFilters, EventActivity } from "@/types";
import { eventEnd, eventStart, eventCount } from "./schedule";
export const eventPageSize = 6;
export const initialEventFilters: EventFilters = {
  query: "",
  category: "all",
  time: "upcoming",
  sort: "soon",
  view: "all",
  page: 1,
  freeOnly: false,
};
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-GH");
export function eventDirectory(
  events: readonly EventItem[],
  filter: EventFilters,
  activity: EventActivity,
  now: Date,
  source: "demo" | "api",
) {
  const query = fold(filter.query.trim()),
    timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) throw new RangeError("A valid event clock is required.");
  const items = events
    .filter((event) => {
      const future = eventEnd(event) > timestamp,
        start = eventStart(event),
        search = fold(
          [
            event.title,
            event.category,
            event.venue,
            event.details?.organizer ?? "",
            ...(event.details?.description ?? []),
            ...(event.details?.highlights ?? []),
          ].join(" "),
        );
      return (
        search.includes(query) &&
        (filter.category === "all" || event.category === filter.category) &&
        (!filter.freeOnly || event.details?.price === 0) &&
        (filter.view !== "going" || activity.goingIds.includes(event.id)) &&
        (filter.view !== "saved" || activity.savedIds.includes(event.id)) &&
        (filter.time === "all" ||
          (filter.time === "past"
            ? !future
            : future &&
              (filter.time === "upcoming" ||
                start < timestamp + (filter.time === "week" ? 7 : 30) * 86400000)))
      );
    })
    .sort((a, b) =>
      filter.sort === "name"
        ? a.title.localeCompare(b.title, "en-GH")
        : filter.sort === "popular"
          ? eventCount(b, activity.goingIds.includes(b.id), source, activity.attendance) -
              eventCount(a, activity.goingIds.includes(a.id), source, activity.attendance) ||
            eventStart(a) - eventStart(b)
          : filter.sort === "price"
            ? (a.details?.price ?? Infinity) - (b.details?.price ?? Infinity) ||
              eventStart(a) - eventStart(b)
            : eventStart(a) - eventStart(b) || a.title.localeCompare(b.title, "en-GH"),
    );
  const totalPages = Math.max(1, Math.ceil(items.length / eventPageSize)),
    page = Math.max(1, Math.min(totalPages, Number.isInteger(filter.page) ? filter.page : 1));
  return {
    items: items.slice((page - 1) * eventPageSize, page * eventPageSize),
    total: items.length,
    totalPages,
    page,
  };
}
