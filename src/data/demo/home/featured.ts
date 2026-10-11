import { images } from "@/config/images";
import { campusPause } from "@/config/media";
import type { FeaturedContentItem } from "@/types";
export const featuredContent: FeaturedContentItem[] = [
  {
    id: "feature-3",
    title: "Make a little space for focus.",
    description: "A calmer week starts with a plan. Try the local demo study planner.",
    type: "sponsored",
    thumbnail: images.studyCorner.src,
    thumbnailAlt: images.studyCorner.alt,
    campaignId: "ad1",
    creator: "Demo Campus Partner",
    destination: "/study-assistant",
    ctaLabel: "Plan my study time",
    sponsored: true,
    active: true,
  },
  {
    id: "feature-1",
    title: "Pause. Breathe. Come back brighter.",
    description: "Five seconds away from the noise. A silent, public-domain visual break.",
    type: "video",
    thumbnail: images.mediaPause.src,
    thumbnailAlt: images.mediaPause.alt,
    mediaSource: campusPause.src,
    captionsSource: campusPause.captions,
    transcript: campusPause.transcript,
    creator: campusPause.credit,
    duration: campusPause.duration,
    destination: "/media",
    ctaLabel: "Play the preview",
    active: true,
  },
];
