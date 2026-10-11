import type { Club } from "@/types/engagement";
import type { CampusMedia } from "@/types/media";
interface Entry {
  id: string;
  name: string;
  category: string;
  description: string;
  tagline: string;
  image: CampusMedia;
  members: number;
  meeting: string;
  venue: string;
  fee?: number;
  leader: string;
  coLead: string;
  objectives: string[];
  highlights: string[];
  rank: number;
  accepting?: boolean;
}
export function clubEntry(input: Entry): Club {
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    description: input.description,
    cover: input.image.src,
    objectives: input.objectives,
    details: {
      tagline: input.tagline,
      coverAlt: input.image.alt,
      memberCount: input.members,
      meeting: input.meeting,
      venue: input.venue,
      fee: input.fee ?? 0,
      founded: 2020,
      accepting: input.accepting ?? true,
      rank: input.rank,
      story: [
        input.description,
        `In this fictional community, the best starting point is a little curiosity. Join a relaxed ${input.meeting.toLowerCase()} session at ${input.venue} and try ${input.highlights[0].toLowerCase()}. No prior experience is needed.`,
      ],
      highlights: input.highlights,
      leaders: [
        { name: input.leader, role: "Demo community lead" },
        { name: input.coLead, role: "Demo welcome coordinator" },
      ],
      gallery: [{ src: input.image.src, alt: input.image.alt }],
    },
  };
}
