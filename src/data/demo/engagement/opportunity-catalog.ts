import { images } from "@/config/images";
import type { Opportunity } from "@/types";
import type { ListingDetails } from "@/types/listings";
export const opportunityDetails = (
  title: string,
  kind: string,
): ListingDetails => ({
  intro:
    "A fictional pathway to learn, build experience and explore what comes next.",
  body: [
    `${title} is an illustrative CampusOne opportunity, not a verified provider announcement. Confirm eligibility, documents, fees and closing dates with a real provider before submitting.`,
    `Prepare a concise personal statement, relevant portfolio and questions for the provider. Never share passwords or send payment to secure an unverified internship or scholarship.`,
  ],
  gallery: [images.clubMakers, images.clubDebate, images.studyCorner],
  kind,
  owner: "Fictional opportunity desk",
  tags: ["Verify with the provider", "Prepare your portfolio"],
  eligibility: [
    "Illustrative student eligibility; consult the actual provider.",
    "Check programme, year and documentation requirements.",
    "A local draft is not a submitted application.",
  ],
});
const titles = [
  "Campus Design Fellowship",
  "Open Source Mentorship",
  "Graduate Research Bursary",
  "Student Innovation Challenge",
  "Community Tech Volunteer",
  "Data Skills Weekend",
  "Accessibility Design Workshop",
  "Junior Product Internship",
  "Teaching Support Programme",
  "Applications Closed: Demo Fellowship",
];
export const extraOpportunities: Opportunity[] = titles.map((title, n) => ({
  id: `o${n + 3}`,
  title,
  provider: "Fictional CampusOne learning partner",
  category: ["Internship", "Scholarship", "Competition", "Training"][n % 4],
  deadline:
    n === 9 ? "2026-10-01" : `2026-11-${String(n + 4).padStart(2, "0")}`,
  summary:
    "An illustrative student pathway. Verify all requirements and application routes independently.",
  details: opportunityDetails(
    title,
    ["Internship", "Scholarship", "Competition", "Training"][n % 4],
  ),
}));
