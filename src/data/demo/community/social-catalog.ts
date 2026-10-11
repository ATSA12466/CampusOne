import { images } from "@/config/images";
import type {
  CommunityPost,
  Conversation,
  NotificationItem,
} from "@/types/community";
const stories = [
  [
    "Esi Owusu",
    "Study",
    "A small reminder: you do not have to finish everything in one sitting. Our library circle is trying 45-minute focus blocks this week.",
  ],
  [
    "Kweku Boateng",
    "Campus life",
    "The best part of campus is finding people who make room for your questions. What helped you feel at home in your first semester?",
  ],
  [
    "Akua Mensah",
    "Events",
    "A courtyard full of ideas, music and good conversation. Looking forward to the next fictional campus showcase in this demo.",
  ],
  [
    "Nana Osei",
    "Clubs",
    "Three sketches, one prototype and a very patient team. A little progress from our makers' table.",
  ],
  [
    "Abena Addo",
    "Opportunities",
    "Updating my portfolio one small project at a time. What is something you learned outside a lecture hall this month?",
  ],
  [
    "Yaw Asante",
    "Study",
    "A useful study habit: explain one concept to a friend without your notes, then find the gaps together.",
  ],
  [
    "Efua Quaye",
    "Campus life",
    "Made room for a walk, a proper lunch and a chat with a friend. A full schedule still deserves a little breathing space.",
  ],
  [
    "Kojo Danso",
    "Clubs",
    "Looking for a low-pressure place to try public speaking? The demo debate community is a good starting point.",
  ],
  [
    "Adwoa Sarpong",
    "Events",
    "There is something special about an intimate open-mic. Which song would you bring to the courtyard?",
  ],
  [
    "Kwame Tetteh",
    "Opportunities",
    "Saved a few internship pathways and set aside time to review eligibility carefully. No need to rush an application.",
  ],
] as const;
const covers = [
  images.studyCorner,
  images.campusLife,
  images.eventSocial,
  images.clubMakers,
  images.clubArts,
];
export const additionalPosts: CommunityPost[] = stories.map(
  ([author, topic, body], i) => ({
    id: `p${i + 3}`,
    author,
    body,
    createdAt: `2026-10-${String(7 - Math.floor(i / 2)).padStart(2, "0")}T12:00:00Z`,
    likes: 3 + i * 2,
    comments: 0,
    details: { topic, cover: covers[i % covers.length] },
  }),
);
export const additionalConversations: Conversation[] = [
  "Library study circle",
  "Makers' project table",
  "Campus music friends",
  "Volunteer planning group",
].map((name, i) => ({
  id: `c${i + 3}`,
  name,
  lastMessage:
    "Fictional conversation preview. New demo messages stay on this device.",
  updatedAt: "Demo preview",
}));
export const additionalNotifications: NotificationItem[] = Array.from(
  { length: 10 },
  (_, i) => ({
    id: `n${i + 3}`,
    title: [
      "A campus community to explore",
      "An idea for your study week",
      "A little plan for the courtyard",
      "A saved pathway to review",
    ][i % 4],
    description:
      "Illustrative demo update, not an official message or live notification.",
    href: ["/clubs", "/academics", "/events", "/opportunities"][i % 4],
    read: i > 5,
    category: (["clubs", "tasks", "events", "announcement"] as const)[i % 4],
  }),
);
