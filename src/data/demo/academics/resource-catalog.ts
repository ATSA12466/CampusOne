import { images } from "@/config/images";
import type { LearningResource } from "@/types";
import type { ListingDetails } from "@/types/listings";
export const resourceDetails = (title: string): ListingDetails => ({
  intro: "An illustrative study companion, not an official course handout.",
  body: [
    `${title}: start with a clear definition, work through a small example and explain the result in your own words.`,
    `Use active recall: close the notes, write three questions, then compare your answers. Consult the official LMS and lecturer materials for assessments and authoritative content.`,
  ],
  gallery: [images.studyCorner, images.clubMakers, images.clubDebate],
  kind: "Demo study resource",
  owner: "Fictional CampusOne study desk",
  tags: ["Active recall", "Check official LMS"],
});
const titles = [
  "SQL join practice sheet",
  "Network addressing workbook",
  "Requirements interview checklist",
  "Testing a small application",
  "Database index notes",
  "TCP and UDP recap",
  "Team project retrospective",
  "Data modelling worksheet",
  "Version control quick guide",
];
export const extraResources: LearningResource[] = titles.map((title, n) => ({
  id: `r${n + 4}`,
  title,
  course: ["ITT 341", "ITT 315", "ITT 351"][n % 3],
  category: ["pdf", "slides", "link"][n % 3] as "pdf" | "slides" | "link",
  description:
    "Illustrative revision prompts, not an official lecturer handout.",
  uploadedAt: `2026-10-${String(n + 4).padStart(2, "0")}`,
  downloadable: true,
  details: resourceDetails(title),
}));
