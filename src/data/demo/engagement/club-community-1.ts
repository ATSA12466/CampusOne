import { images } from "@/config/images";
import { clubEntry } from "./club-entry";
export const communityClubs1 = [
  clubEntry({
    ...{
      id: "club-9",
      name: "Court & Crew",
      category: "Sports & wellbeing",
      description:
        "Friendly basketball practice, team drills and good company. Start with a pass and find your rhythm without the pressure of trials.",
      tagline: "More play. Better days.",
      members: 112,
      meeting: "Wednesdays · 5:00pm",
      venue: "Demo Tesano Recreation Court",
      fee: 0,
      leader: "Kweku Ansah",
      coLead: "Ama Amponsah",
      objectives: [
        "Encourage inclusive recreation",
        "Learn team skills",
        "Support student wellbeing",
      ],
      highlights: ["Beginner practice", "Friendly mixed-team games", "Team warm-ups"],
      rank: 4,
    },
    image: images.clubSport,
  }),
  clubEntry({
    ...{
      id: "club-10",
      name: "Weekend Walkers",
      category: "Sports & wellbeing",
      description:
        "Step away from your screen for a sociable campus walk. Gentle movement, fresh air and a friendly pace for students of different fitness levels.",
      tagline: "Take a breath. Take a step.",
      members: 76,
      meeting: "Saturdays · 7:00am",
      venue: "Demo Courtyard Meeting Point",
      fee: 0,
      leader: "Afia Owusu",
      coLead: "Yaw Asare",
      objectives: [
        "Make movement approachable",
        "Build social connections",
        "Practice safe group walks",
      ],
      highlights: ["Gentle campus loops", "Buddy walks", "Wellbeing check-ins"],
      rank: 11,
    },
    image: images.campusLife,
  }),
  clubEntry({
    ...{
      id: "club-11",
      name: "Green Campus Collective",
      category: "Service & leadership",
      description:
        "Learn practical ways to care for your everyday environment. Plant, mend, share and turn thoughtful small habits into collective action.",
      tagline: "Small actions. A greener tomorrow.",
      members: 96,
      meeting: "Saturdays · 9:00am",
      venue: "Demo Community Garden",
      fee: 0,
      leader: "Efua Mensah",
      coLead: "Kwame Bediako",
      objectives: [
        "Learn sustainable habits",
        "Practice community gardening",
        "Share reuse and repair skills",
      ],
      highlights: ["Seedling afternoons", "Reuse workshops", "Garden teamwork"],
      rank: 7,
    },
    image: images.clubService,
  }),
  clubEntry({
    ...{
      id: "club-12",
      name: "Student Volunteer Network",
      category: "Service & leadership",
      description:
        "A thoughtful place to plan community-minded activities and build teamwork. This demo network illustrates participation, not real volunteering placements.",
      tagline: "Show up. Make room for others.",
      members: 154,
      meeting: "Mondays · 5:00pm",
      venue: "Demo Student Common Room",
      fee: 0,
      leader: "Esi Addo",
      coLead: "Kofi Amoah",
      objectives: [
        "Practice community-minded teamwork",
        "Plan inclusive activities",
        "Reflect on responsible service",
      ],
      highlights: ["Volunteer planning circles", "Team orientation", "Peer skills sharing"],
      rank: 8,
    },
    image: images.clubService,
  }),
];
