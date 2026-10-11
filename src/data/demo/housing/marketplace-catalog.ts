import { images } from "@/config/images";
import type { MarketplaceListing } from "@/types";
import type { ListingDetails } from "@/types/listings";
export const marketDetails = (title: string, n: number): ListingDetails => ({
  intro:
    "A useful fictional find for student life. Check condition and terms before arranging a purchase.",
  body: [
    `${title} is an illustrative listing. Product-category photographs do not show the actual item. Ask for current photographs, confirm included accessories and inspect the item in a safe public place.`,
    `Never share a password, send an advance payment to an unverified seller or assume a device-only draft has reached another person.`,
  ],
  gallery: [images.marketDesk, images.campusMarket, images.studyCorner],
  kind: n % 2 ? "Study Material" : "Student Essentials",
  owner: "Fictional student seller",
  tags: ["Inspect before paying", "Meet in a public place"],
  priceValue: 25 + n * 15,
  condition:
    n % 2 ? "Used · inspect condition" : "Illustrative new / digital item",
});
const titles = [
  "Scientific calculator",
  "Reusable study desk lamp",
  "Plain laptop backpack",
  "Compact headphones",
  "Introduction to networks notes",
  "Second-hand drafting set",
  "Dorm room kettle",
  "Algorithms revision cards",
  "Laptop stand",
  "Campus bicycle helmet",
];
export const extraMarketplace: MarketplaceListing[] = titles.map(
  (title, n) => ({
    id: `mk${n + 3}`,
    title,
    category: n % 2 ? "Study Material" : "Student Essentials",
    priceLabel: `GH₵ ${25 + n * 15}`,
    description:
      "A fictional useful student item. Condition and availability must be checked; no real seller is contacted.",
    details: marketDetails(title, n),
  }),
);
