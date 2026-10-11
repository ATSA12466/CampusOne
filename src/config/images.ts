import { eventImageBlurs } from "./event-image-blurs";
import { clubImageBlurs } from "./club-image-blurs";
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
  sourceNote:
    "Original local SVG stand-in, retained for replacement with authorized photography.",
});
export const images = {
  housingRoom: {
    src: "/images/demo/housing-room.webp",
    alt: "Airy fictional student bedroom with a sunlit desk, neat bed and tropical greenery — generated illustration, not an actual property.",
    width: 1200,
    height: 675,
    provenance: "generated",
    sourceNote: generatedSource,
    blurDataURL:
      "data:image/webp;base64,UklGRnwAAABXRUJQVlA4IHAAAAAwBACdASoUAAsAPyV6tVIuJ6UisAgBwCSJQBOmUABhc+hlPt6Mbc5CZ4AA94tahcBUlTVzBR5dnE4l8P/hKtDdesBeZEz6C9B8vZqM2IlKXquETxvPiBQ+DYLL7cmANPukgwKKuoh5MkF+NA1uAAAA",
  },
  marketDesk: {
    src: "/images/demo/market-desk.webp",
    alt: "Useful student objects including notebooks, backpack and headphones on a sunlit desk — generated product-category illustration, not actual items for sale.",
    width: 1200,
    height: 675,
    provenance: "generated",
    sourceNote: generatedSource,
    blurDataURL:
      "data:image/webp;base64,UklGRoAAAABXRUJQVlA4IHQAAAAQBACdASoUAAsAPyV6tFGuJ6UisAgBwCSJbACdMoABoj2ndckf4LxAAAD764Pz39eT9nZEyxPwm6TwldPanfObhJQTd4cXfWMI7OjEj9R+vb9niSmo4IifnS1g/4YFpomtnqfgjp1wBpBIWMTFg/STE/eAAA==",
  },

  eventShowcase: {
    src: "/images/demo/event-showcase.webp",
    alt: "Fictional Ghanaian students sharing a robotics project at a golden-hour courtyard showcase — AI-generated demonstration, not an actual GCTU event.",
    width: 1200,
    height: 675,
    blurDataURL: eventImageBlurs.showcase,
    focalPoint: { x: 64, y: 46 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  eventMusic: {
    src: "/images/demo/event-music.webp",
    alt: "Fictional Ghanaian students performing an intimate courtyard open-mic with microphone and guitar — AI-generated demonstration, not actual performers.",
    width: 1200,
    height: 675,
    blurDataURL: eventImageBlurs.music,
    focalPoint: { x: 60, y: 48 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  eventSocial: {
    src: "/images/demo/event-social.webp",
    alt: "Fictional Ghanaian student friends sharing a board game at a sunny tropical picnic table — AI-generated demonstration, not an actual campus gathering.",
    width: 1200,
    height: 675,
    blurDataURL: eventImageBlurs.social,
    focalPoint: { x: 62, y: 50 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  clubMakers: {
    src: "/images/demo/club-makers.webp",
    alt: "Fictional Ghanaian students building a small robotics prototype together in a sunny workshop — AI-generated demo, not an actual club or GCTU photograph.",
    width: 1200,
    height: 675,
    blurDataURL: clubImageBlurs.makers,
    focalPoint: { x: 55, y: 48 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  clubDebate: {
    src: "/images/demo/club-debate.webp",
    alt: "Fictional Ghanaian students sharing ideas in a friendly seminar-room debate — AI-generated campus demonstration.",
    width: 1200,
    height: 675,
    blurDataURL: clubImageBlurs.debate,
    focalPoint: { x: 55, y: 48 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  clubArts: {
    src: "/images/demo/club-arts.webp",
    alt: "Fictional Ghanaian students painting, sketching and photographing artwork in a bright studio — AI-generated demonstration.",
    width: 1200,
    height: 675,
    blurDataURL: clubImageBlurs.arts,
    focalPoint: { x: 55, y: 48 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  clubSport: {
    src: "/images/demo/club-sport.webp",
    alt: "Fictional student friends enjoying a basketball practice on a tropical campus court — AI-generated demonstration, not an actual team.",
    width: 1200,
    height: 675,
    blurDataURL: clubImageBlurs.sport,
    focalPoint: { x: 55, y: 48 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
  clubService: {
    src: "/images/demo/club-service.webp",
    alt: "Fictional student volunteers planting seedlings together in a tropical garden — AI-generated demonstration, not an actual volunteering project.",
    width: 1200,
    height: 675,
    blurDataURL: clubImageBlurs.service,
    focalPoint: { x: 55, y: 48 },
    provenance: "generated",
    sourceNote: generatedSource,
  },
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
  clubDebatePlaceholder: placeholder(
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
