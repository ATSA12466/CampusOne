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
  {
    id: "md3",
    title: "A botanical breathing pause",
    kind: "video",
    creator: "MDN CC0 sample",
    duration: "0:05",
    thumbnail: images.mediaPause.src,
    source: "/media/demo/flower.webm",
  },
  {
    id: "md4",
    title: "CC0 sound-effect playback sample",
    kind: "audio",
    creator: "MDN CC0 sample",
    duration: "Short sample",
    thumbnail: images.mediaTwo.src,
    source: "/media/demo/t-rex-roar.mp3",
  },
];
