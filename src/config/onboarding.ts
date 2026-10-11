import { images } from "./images";
export const programmes = [
  "BSc Information Technology",
  "BSc Computer Science",
  "BSc Computer Engineering",
  "BSc Business Administration",
] as const;
export const levels = ["Level 100", "Level 200", "Level 300", "Level 400", "Postgraduate"] as const;
export const campusInterests = [
  "Clubs & societies",
  "Events & culture",
  "Study & academics",
  "Careers & opportunities",
  "Campus living",
  "Student representation",
] as const;
export const onboardingSteps = [
  {
    id: "welcome",
    eyebrow: "01 / A PLACE TO BEGIN",
    title: "Your campus starts with you.",
    description:
      "A little less searching. A little more belonging. Meet your independent student-life companion for GCTU.",
    image: images.campusLife,
  },
  {
    id: "study",
    eyebrow: "02 / MAKE ROOM FOR FOCUS",
    title: "A little plan. A good day.",
    description:
      "Bring your classes, learning resources and to-dos into view. The demo planner stays on this device, not in the university timetable.",
    image: images.studyCorner,
  },
  {
    id: "belong",
    eyebrow: "03 / FIND YOUR PEOPLE",
    title: "Good company changes everything.",
    description:
      "Explore communities, campus events and ideas worth showing up for. Club requests and tickets are labelled demo previews.",
    image: images.clubsHero,
  },
  {
    id: "represent",
    eyebrow: "04 / STAY IN THE LOOP",
    title: "Your voice has a place here.",
    description:
      "Discover student representation, campus updates and opportunities. This independent prototype is not an official SRC or university service.",
    image: images.innovationNight,
  },
  {
    id: "you",
    eyebrow: "05 / MAKE IT YOURS",
    title: "A familiar face. A fresh start.",
    description:
      "Choose your local demo profile and the parts of campus life you're curious about. These are preferences, not official academic registration.",
    image: images.clubsHero,
  },
] as const;
