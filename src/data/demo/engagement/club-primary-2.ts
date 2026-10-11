import { images } from "@/config/images";
import { clubEntry } from "./club-entry";
export const primaryClubs2 = [
  clubEntry({
    ...{
      id: "club-5",
      name: "Design & Makers Guild",
      category: "Arts & culture",
      description:
        "Sketch an idea, test a layout and bring everyday student problems into focus. An open space for visual thinkers and hands-on creators.",
      tagline: "From a thought to a thing.",
      members: 73,
      meeting: "Mondays · 4:30pm",
      venue: "Demo Creative Studio",
      fee: 0,
      leader: "Nana Ama Tetteh",
      coLead: "Kojo Addo",
      objectives: [
        "Explore accessible design",
        "Make and test creative ideas",
        "Give constructive feedback",
      ],
      highlights: ["Sketchbook afternoons", "Design critique circles", "Creative collaborations"],
      rank: 3,
    },
    image: images.clubArts,
  }),
  clubEntry({
    ...{
      id: "club-6",
      name: "Lantern Film Circle",
      category: "Arts & culture",
      description:
        "Discover visual storytelling through thoughtful screenings, photo walks and small student-made films. Bring your perspective, not expensive gear.",
      tagline: "Every frame has a story.",
      members: 58,
      meeting: "Fridays · 5:00pm",
      venue: "Demo Media Room",
      fee: 15,
      leader: "Selorm Agyemang",
      coLead: "Esi Quartey",
      objectives: [
        "Learn visual storytelling",
        "Create original short films",
        "Share ethical photography",
      ],
      highlights: ["Phone-camera photo walks", "Storyboarding sessions", "Film conversations"],
      rank: 9,
    },
    image: images.clubArts,
  }),
  clubEntry({
    ...{
      id: "club-7",
      name: "Campus Rhythm Collective",
      category: "Arts & culture",
      description:
        "Make room for music, poetry and performance. Share your first verse, try a rhythm and enjoy a supportive space to rehearse.",
      tagline: "A little rhythm. A lot of heart.",
      members: 104,
      meeting: "Thursdays · 4:30pm",
      venue: "Demo Open-Air Commons",
      fee: 0,
      leader: "Adwoa Sarpong",
      coLead: "Kwesi Mensah",
      objectives: [
        "Support original performance",
        "Collaborate across art forms",
        "Build stage confidence",
      ],
      highlights: ["Open rehearsal circles", "Spoken-word afternoons", "Student showcase practice"],
      rank: 10,
    },
    image: images.innovationNight,
  }),
  clubEntry({
    ...{
      id: "club-8",
      name: "Books & Brew Society",
      category: "Arts & culture",
      description:
        "Read at your own pace and come for the conversation. Short stories, thoughtful questions and friendly recommendations in a relaxed corner of campus.",
      tagline: "One good book. New perspectives.",
      members: 48,
      meeting: "Tuesdays · 5:00pm",
      venue: "Demo Library Garden",
      fee: 0,
      leader: "Akua Frimpong",
      coLead: "Kojo Ofori",
      objectives: [
        "Share diverse reading",
        "Practice thoughtful discussion",
        "Welcome new readers",
      ],
      highlights: ["Short-story swaps", "Reading afternoons", "Peer book recommendations"],
      rank: 13,
    },
    image: images.studyCorner,
  }),
];
