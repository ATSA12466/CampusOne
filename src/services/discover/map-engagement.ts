import { images } from "@/config/images";
import { clubCover, clubFee } from "@/lib/clubs/media";
import { eventCover, eventPrice } from "@/lib/events/media";
import { eventDate } from "@/lib/events/schedule";
import { isCampusDate } from "@/lib/home/schedule";
import type { Club, EventItem, Opportunity } from "@/types";
import type { DiscoverItem } from "@/types/discover";
export function discoverClub(club: Club): DiscoverItem {
  return {
    category: "clubs",
    id: club.id,
    title: club.name,
    description: club.description,
    href: `/clubs/${encodeURIComponent(club.id)}`,
    destination: "detail",
    cover: clubCover(club),
    illustrative: false,
    rank: club.details?.rank,
    facts: [
      { label: "Interest", value: club.category },
      {
        label: "Meet-up",
        value: club.details?.meeting ?? "Meeting not supplied",
      },
      { label: "Fee", value: clubFee(club) },
    ],
  };
}
export function discoverEvent(event: EventItem): DiscoverItem {
  return {
    category: "events",
    id: event.id,
    title: event.title,
    description:
      event.details?.tagline ??
      `An event at ${event.venue}. More details are on its listing.`,
    href: `/events/${encodeURIComponent(event.id)}`,
    destination: "detail",
    cover: eventCover(event),
    illustrative: !event.details,
    rank: event.details?.rank,
    date: event.date,
    event: {
      date: event.date,
      endsAt: event.details?.endsAt,
      startsAt: event.details?.startsAt,
      closesAt: event.details?.bookingClosesAt,
      cancelled: event.details?.status === "cancelled",
      full: event.registered >= event.seats,
    },
    facts: [
      { label: "When", value: eventDate(event) },
      { label: "Where", value: event.venue },
      { label: "Fee", value: eventPrice(event) },
    ],
  };
}
export function discoverOpportunity(item: Opportunity): DiscoverItem {
  return {
    category: "opportunities",
    id: item.id,
    title: item.title,
    description: item.summary,
    href: `/opportunities/${encodeURIComponent(item.id)}`,
    destination: "detail",
    cover: images.clubMakers,
    illustrative: true,
    ...(isCampusDate(item.deadline) ? { date: item.deadline } : {}),
    facts: [
      { label: "Provider", value: item.provider },
      { label: "Type", value: item.category },
      { label: "Deadline", value: item.deadline || "Deadline not supplied" },
    ],
  };
}
