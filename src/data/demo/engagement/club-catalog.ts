import { images } from "@/config/images";
import { primaryClubs } from "./club-catalog-primary";
import { communityClubs } from "./club-catalog-community";
export const clubs = [...primaryClubs, ...communityClubs].map((club) => ({
  ...club,
  details: club.details
    ? {
        ...club.details,
        gallery: [
          ...club.details.gallery,
          { src: images.clubsHero.src, alt: images.clubsHero.alt },
          { src: images.campusLife.src, alt: images.campusLife.alt },
        ],
      }
    : undefined,
}));
