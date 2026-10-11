import { images } from "@/config/images";
import { clubEntry } from "./club-entry";
export const primaryClubs1 = [
  clubEntry({
    ...{
      id: "club-1",
      name: "Code Collective",
      category: "technology",
      description:
        "Peer coding sessions, hackathons, and product showcases. Build small useful things with friends, from your first webpage to a working app.",
      tagline: "Good ideas start together.",
      members: 128,
      meeting: "Wednesdays · 4:00pm",
      venue: "Demo Innovation Lab, Tesano",
      fee: 0,
      leader: "Kojo Mensah",
      coLead: "Akosua Asare",
      objectives: ["Build practical projects", "Mentor freshers", "Host coding events"],
      highlights: ["Beginner-friendly code jams", "Peer mentoring", "Prototype showcases"],
      rank: 1,
    },
    image: images.clubMakers,
  }),
  clubEntry({
    ...{
      id: "club-2",
      name: "Debate Assembly",
      category: "public-speaking",
      description:
        "Weekly debate and communication mastery workshops. Practice a clear point of view, listen generously and become a more confident speaker.",
      tagline: "Find your voice. Share the room.",
      members: 86,
      meeting: "Thursdays · 5:00pm",
      venue: "Demo Seminar Room A",
      fee: 0,
      leader: "Esi Owusu",
      coLead: "Yaw Osei",
      objectives: ["Critical thinking", "Confident public speaking"],
      highlights: [
        "Friendly debate circles",
        "Public-speaking practice",
        "Student-led discussions",
      ],
      rank: 2,
    },
    image: images.clubDebate,
  }),
  clubEntry({
    ...{
      id: "club-3",
      name: "Robotics Studio",
      category: "Technology",
      description:
        "Turn tiny motors, sensors and curious questions into hands-on prototypes. A welcoming workshop for makers at every skill level.",
      tagline: "Make something that moves.",
      members: 64,
      meeting: "Fridays · 3:30pm",
      venue: "Demo Engineering Workshop",
      fee: 20,
      leader: "Kwame Boateng",
      coLead: "Efua Boakye",
      objectives: [
        "Learn practical electronics",
        "Build collaborative prototypes",
        "Share safe workshop skills",
      ],
      highlights: ["Sensor starter sessions", "Team build afternoons", "Demo robotics challenges"],
      rank: 5,
    },
    image: images.clubMakers,
  }),
  clubEntry({
    ...{
      id: "club-4",
      name: "Data & AI Circle",
      category: "Technology",
      description:
        "Explore useful data, responsible AI and the stories hidden inside a spreadsheet. Learn together through small guided experiments.",
      tagline: "A curious mind. A useful insight.",
      members: 92,
      meeting: "Tuesdays · 4:00pm",
      venue: "Demo Learning Commons",
      fee: 0,
      leader: "Abena Darko",
      coLead: "Kofi Adjei",
      objectives: ["Practice data literacy", "Discuss responsible AI", "Build a small portfolio"],
      highlights: ["Notebook study circles", "Data storytelling", "Peer portfolio reviews"],
      rank: 6,
    },
    image: images.studyCorner,
  }),
];
