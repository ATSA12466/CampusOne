import type { CampusMedia } from "@/types/media";

// Every static photo/stand-in URL lives here. Upload/API URLs arrive as typed data.
const blur =
  "data:image/webp;base64,UklGRr4AAABXRUJQVlA4ILIAAADQAwCdASoYAA4APwForE6rJiQiMAgBYCAJYgCdAYyAdqxlRiB9L+AA/oOJA1Puqx01mx6kr2M2oQoVGUS+DxL24NewP3Vl0flJyQk4PCvhU34D225BGDm+3MSWIgsHXZ5U0KuHeIJ+fC3m3dqvFX9uvK+kUVlAsRUyDVPPVbqaWXy+7BmV+54kt7tQdbal970aZ9coVAjHYEh9TvquedhX5RZJah49dy31dL9l+tOyAAAA";
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
export const approvedImageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);
export function isAllowedImageSrc(src: string) {
  if (/[\\\u0000-\u001f]/.test(src)) return false;
  if (src.startsWith("/") && !src.startsWith("//")) {
    try {
      return !/(?:^|\/)(?:\.|\.\.)(?:\/|$)/.test(decodeURIComponent(src.split("?")[0]));
    } catch {
      return false;
    }
  }
  if (src.startsWith("blob:")) return true;
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      approvedImageHosts.includes(url.hostname)
    );
  } catch {
    return false;
  }
}
