import type { ImageKey } from "@/types/media";
export const homeShortcuts: readonly {
  title: string;
  description: string;
  href: string;
  image: ImageKey;
}[] = [
  {
    title: "Events",
    description: "Be part of the moment",
    href: "/events",
    image: "innovationNight",
  },
  { title: "Learn", description: "A little head start", href: "/academics", image: "studyCorner" },
  {
    title: "Opportunities",
    description: "Your next chapter",
    href: "/opportunities",
    image: "campusLife",
  },
  {
    title: "Find a room",
    description: "Make yourself at home",
    href: "/accommodation",
    image: "campusLiving",
  },
  {
    title: "Marketplace",
    description: "Good finds, closer",
    href: "/marketplace",
    image: "campusMarket",
  },
  {
    title: "Discover",
    description: "Take a different turn",
    href: "/discover",
    image: "clubsHero",
  },
];
// Official GCTU sources recorded in docs/PHASE4_HOME.md; these open outside CampusOne.
export const institutionalLinks = [
  {
    id: "lms",
    title: "GCTU LMS",
    description: "Course materials & assignments",
    href: "https://lms.gctu.edu.gh/",
  },
  {
    id: "sip",
    title: "Student portal",
    description: "GCTU SIP · registration & results",
    href: "https://sip.gctu.edu.gh/",
  },
] as const;
