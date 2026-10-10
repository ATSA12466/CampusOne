import { images } from "@/config/images";
import type { MediaItem } from "@/types";

export const mediaItems: MediaItem[] = [
  {
    id: "md1",
    title: "Build your exam week momentum",
    kind: "podcast",
    creator: "CampusOne Studio",
    duration: "18:30",
    thumbnail: images.mediaOne.src,
  },
  {
    id: "md2",
    title: "Career clarity for final-year students",
    kind: "video",
    creator: "Career Desk",
    duration: "09:50",
    thumbnail: images.mediaTwo.src,
  },
];
