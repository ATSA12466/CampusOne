import { extraMarketplace, marketDetails } from "./marketplace-catalog";
import { extraAccommodations, housingDetails } from "./accommodation-catalog";
import type {
  AccommodationListing,
  LostFoundReport,
  MarketplaceListing,
} from "@/types";

export const marketplaceListings: MarketplaceListing[] = [
  {
    id: "mk1",
    details: {
      ...marketDetails("Figma UI Kit for Student Projects", 1),
      priceValue: 40,
    },
    title: "Figma UI Kit for Student Projects",
    category: "Digital Template",
    priceLabel: "GH₵ 40",
    description: "Components and screens for capstone app prototypes.",
  },
  {
    id: "mk2",
    details: {
      ...marketDetails("Statistics revision flashcards", 0),
      priceValue: 25,
    },
    title: "Statistics revision flashcards",
    category: "Study Material",
    priceLabel: "GH₵ 25",
    description: "Printable flashcards for exam prep.",
  },
  ...extraMarketplace,
];

export const reports: LostFoundReport[] = [
  {
    id: "lf1",
    type: "lost",
    item: "Black HP laptop sleeve",
    location: "Library 2nd floor",
    date: "2026-10-06",
    status: "open",
  },
  {
    id: "lf2",
    type: "found",
    item: "Student ID card",
    location: "Engineering block",
    date: "2026-10-05",
    status: "open",
  },
];

export const accommodations: AccommodationListing[] = [
  {
    id: "h1",
    details: {
      ...housingDetails("CityGate Hostel", 2),
      priceValue: 2800,
      walkMinutes: 5,
    },
    title: "CityGate Hostel",
    location: "5 mins from campus",
    price: "GH₵ 2,800 / semester",
    facilities: ["Wi-Fi", "Study room", "Backup power"],
  },
  {
    id: "h2",
    details: { ...housingDetails("BlueNest Residence", 4), priceValue: 3200 },
    title: "BlueNest Residence",
    location: "Adj. Main Road",
    price: "GH₵ 3,200 / semester",
    facilities: ["Water heater", "Security", "Laundry"],
  },
  ...extraAccommodations,
];
