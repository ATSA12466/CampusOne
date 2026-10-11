import type { Metadata } from "next";
import { appConfig } from "./app-config";
import { images } from "./images";

export function pageMetadata(title: string, description: string): Metadata {
  const image = appConfig.appUrl
    ? {
        url: new URL(images.campusLife.src, appConfig.appUrl).href,
        width: images.campusLife.width,
        height: images.campusLife.height,
        alt: images.campusLife.alt,
      }
    : undefined;
  const fullTitle = title.startsWith("CampusOne") ? title : `${title} | CampusOne`;
  return {
    title,
    description,
    openGraph: {
      title: fullTitle,
      description,
      siteName: "CampusOne",
      type: "website",
      locale: "en_GH",
      ...(image ? { images: [image] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: fullTitle, description },
  };
}
const routeCopy = {
  "sign-in": [
    "Sign in",
    "Sign in to your CampusOne student workspace. Current authentication is a clearly marked local demo.",
  ],
  register: [
    "Create an account",
    "Preview student registration for the connected CampusOne experience.",
  ],
  "forgot-password": [
    "Reset your password",
    "Find your way back to your CampusOne account. Email delivery awaits a real authentication service.",
  ],
  onboarding: [
    "Welcome to CampusOne",
    "Explore the communities, academics and everyday possibilities of GCTU student life.",
  ],
  home: [
    "Home",
    "Your GCTU campus at a glance: useful resources, tasks, communities and upcoming events.",
  ],
  academics: [
    "Academics",
    "Discover course resources, track academic goals and find your next study session.",
  ],
  accommodation: [
    "Accommodation",
    "Explore student accommodation and amenities around the GCTU campus.",
  ],
  advertising: [
    "Advertising",
    "Preview CampusOne campaign placements, schedules and student-facing promotions.",
  ],
  announcements: [
    "Announcements",
    "Catch up with campus, club and student representative updates.",
  ],
  calendar: ["Calendar", "Plan your week around classes, student events and personal commitments."],
  clubs: [
    "Clubs & societies",
    "Find a GCTU community that shares your curiosity and explore student club activities.",
  ],
  community: ["Community", "Follow campus conversations and connect with your student community."],
  discover: [
    "Discover",
    "Explore the campus edit: clubs, events, study resources, opportunities, living, marketplace, media and lost-and-found.",
  ],
  events: [
    "Events",
    "Explore campus events and preview student RSVP and demo ticket interactions.",
  ],
  "lost-and-found": [
    "Lost & found",
    "Help a campus item find its way home. Browse student lost-and-found reports.",
  ],
  management: [
    "Management",
    "Preview role-aware CampusOne management tools. Production access control is not connected.",
  ],
  marketplace: [
    "Marketplace",
    "Browse student listings and second-hand essentials. Transactions are not enabled in the demo.",
  ],
  media: [
    "Campus media",
    "Explore student audio and video stories with clear media-availability states.",
  ],
  messages: [
    "Messages",
    "Preview your CampusOne conversations. Real-time messaging awaits backend integration.",
  ],
  notifications: [
    "Notifications",
    "Stay on top of campus updates, events and student workspace reminders.",
  ],
  opportunities: [
    "Opportunities",
    "Explore scholarships, internships and opportunities for your next chapter.",
  ],
  participation: [
    "Participation",
    "Review your campus participation and saved event registrations.",
  ],
  profile: [
    "Your profile",
    "Your CampusOne student identity, programme and saved campus activity.",
  ],
  settings: ["Settings", "Choose your CampusOne appearance and manage local demo preferences."],
  "src-office": [
    "SRC Office",
    "Explore student representatives, campus projects and demo request tracking.",
  ],
  "study-assistant": [
    "Study assistant",
    "Organize your study sessions with a clearly marked local planning assistant.",
  ],
  tasks: [
    "Tasks",
    "Keep coursework and everyday campus commitments organized in your student task list.",
  ],
  timetable: ["Timetable", "Find your next class and plan your week around the student timetable."],
} as const;
export function routeMetadata(route: keyof typeof routeCopy): Metadata {
  const [title, description] = routeCopy[route];
  return pageMetadata(title, description);
}
