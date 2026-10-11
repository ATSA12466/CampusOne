import type { EventItem } from "@/types/engagement";
import type { CampusMedia } from "@/types/media";
interface Entry {
  id: string;
  title: string;
  venue: string;
  date: string;
  category: string;
  seats: number;
  registered: number;
  start: string;
  duration: number;
  image: CampusMedia;
  tagline: string;
  description: string;
  price?: number;
  organizer: string;
  host: string;
  highlights: string[];
  cancelled?: boolean;
}
export function eventEntry(input: Entry): EventItem {
  const start = Date.parse(`${input.date}T${input.start}:00Z`),
    end = start + input.duration * 3600000;
  return {
    id: input.id,
    title: input.title,
    venue: input.venue,
    date: input.date,
    category: input.category,
    seats: input.seats,
    registered: input.registered,
    details: {
      cover: input.image.src,
      coverAlt: input.image.alt,
      tagline: input.tagline,
      description: [
        input.description,
        `A fictional CampusOne gathering at ${input.venue}. This illustrative programme is a place to try something new, meet a few people and make room for your curiosity. It is not a real GCTU event.`,
      ],
      startsAt: new Date(start).toISOString(),
      endsAt: new Date(end).toISOString(),
      bookingClosesAt: new Date(start - 1800000).toISOString(),
      timeZone: "Africa/Accra",
      price: input.price ?? 0,
      organizer: input.organizer,
      status: input.cancelled ? "cancelled" : "scheduled",
      rank: Number(input.id.slice(1)),
      highlights: input.highlights,
      agenda: input.highlights.map((title, index) => ({
        title,
        startsAt: new Date(
          start + (index * input.duration * 3600000) / input.highlights.length,
        ).toISOString(),
        description: "Illustrative session in this fictional demo programme.",
      })),
      speakers: [{ name: input.host, role: "Fictional student host" }],
      accessibility: [
        "Venue access and support are illustrative, not verified.",
        "Check real arrangements with an authorized organizer before travelling.",
      ],
      gallery: [{ src: input.image.src, alt: input.image.alt }],
    },
  };
}
