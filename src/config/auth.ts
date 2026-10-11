import { images } from "./images";
export const authRoles = [
  "student",
  "club-executive",
  "committee-member",
  "src-representative",
  "administrator",
] as const;
export const authStories = {
  signin: {
    image: images.clubsHero,
    eyebrow: "YOUR CAMPUS, CONNECTED",
    title: "Good people. Big possibilities.",
    description:
      "Find your people, make a little plan, and build a campus life that feels like yours.",
  },
  register: {
    image: images.innovationNight,
    eyebrow: "YOUR NEXT CHAPTER",
    title: "Make this place yours.",
    description:
      "The next idea, the next friendship, the next opportunity. It all starts with showing up.",
  },
  recovery: {
    image: images.studyCorner,
    eyebrow: "A LITTLE HELP",
    title: "A pause, not a full stop.",
    description: "Find your way back to your people, your plans and the things you're building.",
  },
} as const;
export const authStorageKey = "campusone-auth";
export const onboardingStorageKey = "campusone-onboarding";
