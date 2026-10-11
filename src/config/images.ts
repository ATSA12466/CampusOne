import { homeImageBlurs } from "./image-blurs";
import type { CampusMedia } from "@/types/media";

// Every static photo/stand-in URL lives here. Upload/API URLs arrive as typed data.
const blur = homeImageBlurs["campus-life"];
const generatedSource =
  "AI-generated for CampusOne; fictional campus and people, not GCTU photographs or actual students.";
const placeholder = (src: string, alt: string): CampusMedia => ({
  src,
  alt,
  width: 1200,
  height: 675,
  provenance: "placeholder",
  sourceNote: "Original local SVG stand-in, retained for replacement with authorized photography.",
});
export const images = {
  clubsHero: {
    src: "/images/demo/clubs-hero.webp",
    alt: "Fictional Ghanaian student friends gathered in a tropical campus courtyard \u2014 AI-generated demo, not GCTU or actual students.",
    width: 1376,
    height: 768,
    blurDataURL: homeImageBlurs["clubs-hero"],
    focalPoint: { x: 68, y: 50 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  studyCorner: {
    src: "/images/demo/study-corner.webp",
    alt: "Fictional students studying together in a bright library \u2014 AI-generated demonstration.",
    width: 1000,
    height: 558,
    blurDataURL: homeImageBlurs["study-corner"],
    focalPoint: { x: 64, y: 50 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  innovationNight: {
    src: "/images/demo/innovation-night.webp",
    alt: "Fictional Ghanaian students sharing a prototype at an evening campus showcase \u2014 AI-generated demonstration.",
    width: 1000,
    height: 558,
    blurDataURL: homeImageBlurs["innovation-night"],
    focalPoint: { x: 52, y: 50 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  campusLiving: {
    src: "/images/demo/campus-living.webp",
    alt: "A fictional student residence courtyard with tropical plants \u2014 AI-generated, not an actual listed property.",
    width: 1000,
    height: 558,
    blurDataURL: homeImageBlurs["campus-living"],
    focalPoint: { x: 50, y: 50 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  campusMarket: {
    src: "/images/demo/campus-market.webp",
    alt: "Fictional Ghanaian students browsing books and a laptop at a campus pop-up \u2014 AI-generated demonstration.",
    width: 1000,
    height: 558,
    blurDataURL: homeImageBlurs["campus-market"],
    focalPoint: { x: 55, y: 50 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  mediaPause: {
    src: "/images/demo/media-pause.webp",
    alt: "Pink flowers in a still extracted from the MDN CC0 video sample; not campus footage.",
    width: 960,
    height: 540,
    provenance: "licensed",
    sourceNote:
      "CC0 MDN interactive-examples flower.webm; local extracted poster. See public/media/demo/README.md.",
  },
  campusLife: {
    src: "/images/demo/campus-life.webp",
    alt: "Students walking through a green campus courtyard — AI-generated demonstration, not an actual GCTU photograph.",
    width: 1376,
    height: 768,
    blurDataURL: blur,
    focalPoint: { x: 64, y: 48 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  studentAma: {
    src: "/images/demo/student-ama.webp",
    alt: "AI-generated student portrait illustrating Ama, a fictional demo student.",
    width: 240,
    height: 240,
    provenance: "generated",
    sourceNote: generatedSource,
  },
  studentKojo: {
    src: "/images/demo/student-kojo.webp",
    alt: "AI-generated student portrait illustrating Kojo, a fictional demo student.",
    width: 240,
    height: 240,
    provenance: "generated",
    sourceNote: generatedSource,
  },
  clubCode: placeholder(
    "/images/placeholders/club-code.svg",
    "Placeholder illustration for the Code Collective club.",
  ),
  clubDebate: placeholder(
    "/images/placeholders/club-debate.svg",
    "Placeholder illustration for the Debate Assembly club.",
  ),
  examFocus: placeholder(
    "/images/placeholders/exam-focus.svg",
    "Placeholder illustration for exam preparation media.",
  ),
  audioSprint: placeholder(
    "/images/placeholders/audio-sprint.svg",
    "Placeholder illustration for a guided study audio session.",
  ),
  dataBundle: placeholder(
    "/images/placeholders/data-bundle.svg",
    "Placeholder illustration for a student data-bundle promotion.",
  ),
  opportunity: placeholder(
    "/images/placeholders/opportunity.svg",
    "Placeholder illustration for a learning opportunity.",
  ),
  mediaOne: placeholder(
    "/images/placeholders/media-1.svg",
    "Placeholder illustration for CampusOne podcast media.",
  ),
  mediaTwo: placeholder(
    "/images/placeholders/media-2.svg",
    "Placeholder illustration for campus announcements and media.",
  ),
  unavailable: {
    src: "/images/demo/intentionally-unavailable.webp",
    alt: "Demonstration of an unavailable campus photograph.",
    width: 1600,
    height: 900,
    provenance: "placeholder",
  },
} as const satisfies Record<string, CampusMedia>;

export const srcLogo: CampusMedia | null = null; // Supply the official SRC artwork here; do not fabricate a logo.
export function imageForSrc(src: string): CampusMedia | undefined {
  return Object.values(images).find((image) => image.src === src);
}
export { approvedImageHosts, isAllowedImageSrc } from "./image-policy";
