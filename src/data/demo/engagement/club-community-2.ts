import { images } from "@/config/images";
import { clubEntry } from "./club-entry";
export const communityClubs2 = [
  clubEntry({
    ...{
      id: "club-13",
      name: "Founders Table",
      category: "Careers & enterprise",
      description:
        "Talk through a useful idea, test a small experiment and learn from one another. A friendly starting point for curious student entrepreneurs.",
      tagline: "Your next idea needs good company.",
      members: 81,
      meeting: "Thursdays · 3:30pm",
      venue: "Demo Enterprise Corner",
      fee: 0,
      leader: "Naa Adjeley",
      coLead: "Kojo Danso",
      objectives: [
        "Test practical ideas",
        "Learn responsible enterprise",
        "Connect creative teammates",
      ],
      highlights: ["Idea feedback tables", "Simple business experiments", "Demo pitch practice"],
      rank: 12,
    },
    image: images.campusMarket,
  }),
  clubEntry({
    ...{
      id: "club-14",
      name: "Women in STEM Circle",
      category: "Careers & enterprise",
      description:
        "Share technical curiosity, peer support and practical study strategies. A welcoming community for women building their next chapter in STEM.",
      tagline: "Curiosity belongs to everyone.",
      members: 68,
      meeting: "Tuesdays · 3:30pm",
      venue: "Demo Innovation Lab",
      fee: 0,
      leader: "Akosua Mensah",
      coLead: "Adwoa Asante",
      objectives: [
        "Support women in technical study",
        "Share practical knowledge",
        "Build confidence through mentoring",
      ],
      highlights: ["Peer study partnerships", "Hands-on starter sessions", "Career conversations"],
      rank: 14,
    },
    image: images.clubMakers,
  }),
  clubEntry({
    ...{
      id: "club-15",
      name: "Language & Culture Exchange",
      category: "Culture & connection",
      description:
        "Trade everyday phrases, share food stories and connect across backgrounds. Listen, learn and enjoy the many perspectives in student life.",
      tagline: "Many backgrounds. One shared table.",
      members: 62,
      meeting: "Fridays · 4:00pm",
      venue: "Demo Campus Commons",
      fee: 0,
      leader: "Sena Akoto",
      coLead: "Nana Yaw Ampofo",
      objectives: [
        "Learn across languages",
        "Practice respectful cultural exchange",
        "Build inclusive friendships",
      ],
      highlights: ["Conversation pairs", "Culture storytelling", "Language starter circles"],
      rank: 15,
    },
    image: images.clubsHero,
  }),
  clubEntry({
    ...{
      id: "club-16",
      name: "Peer Learning Partners",
      category: "Study & academics",
      description:
        "Study a little more steadily with a supportive group. Break down difficult topics, plan a shared session and explain what you have learned.",
      tagline: "A hard topic. A helpful friend.",
      members: 138,
      meeting: "Mondays · 3:00pm",
      venue: "Demo Learning Commons",
      fee: 0,
      leader: "Abena Owusu",
      coLead: "Kwesi Aidoo",
      objectives: [
        "Practice collaborative learning",
        "Share revision strategies",
        "Support newcomers",
      ],
      highlights: ["Small-group revision", "Peer explanation sessions", "Study planning"],
      rank: 16,
    },
    image: images.studyCorner,
  }),
];
