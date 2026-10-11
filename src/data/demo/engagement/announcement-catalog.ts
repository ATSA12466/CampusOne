import type { Announcement } from "@/types";
const entries = [
  [
    "A quiet corner for the next chapter",
    "A fictional reading-circle invitation. Ask the library desk about actual opening hours.",
    "campus",
  ],
  [
    "Make room for a good question",
    "Demo discussion afternoon for students curious about responsible technology.",
    "club",
  ],
  [
    "An idea worth sharing",
    "Fictional student project showcase briefing. Confirm real event details with organizers.",
    "club",
  ],
  [
    "A little kindness goes a long way",
    "Demo welfare conversation about looking out for friends during a busy semester.",
    "src",
  ],
  [
    "Plan your week with a little breathing room",
    "A fictional campus planning reminder. This is not the official class timetable.",
    "campus",
  ],
  [
    "Bring your curiosity to the makers table",
    "Demo robotics meetup update. No real registration or university authorization is implied.",
    "club",
  ],
  [
    "The next chapter starts with a conversation",
    "Fictional career-circle announcement. Check official opportunities before applying.",
    "campus",
  ],
  [
    "Small changes, shared spaces",
    "An illustrative student-led sustainability update, not verified SRC project progress.",
    "src",
  ],
  [
    "Keep your personal information personal",
    "A demo privacy reminder. CampusOne does not replace institutional safety advice.",
    "campus",
  ],
  [
    "Take a moment to hear another perspective",
    "Fictional dialogue-club invitation with no official venue or speaker claim.",
    "club",
  ],
] as const;
export const extraAnnouncements: Announcement[] = entries.map(
  ([title, content, category], i) => ({
    id: `a${i + 3}`,
    title,
    content,
    category,
    pinned: false,
    publishedAt: `2026-10-${String(Math.max(1, 6 - i)).padStart(2, "0")}`,
  }),
);
