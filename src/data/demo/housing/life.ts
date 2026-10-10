import type { AccommodationListing, LostFoundReport, MarketplaceListing } from "@/types";

export const marketplaceListings: MarketplaceListing[] = [
  {
    id: "mk1",
    title: "Figma UI Kit for Student Projects",
    category: "Digital Template",
    priceLabel: "GHS 40",
    description: "Components and screens for capstone app prototypes.",
  },
  {
    id: "mk2",
    title: "Statistics revision flashcards",
    category: "Study Material",
    priceLabel: "GHS 25",
    description: "Printable flashcards for exam prep.",
  },
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
    title: "CityGate Hostel",
    location: "5 mins from campus",
    price: "GHS 2,800 / semester",
    facilities: ["Wi-Fi", "Study room", "Backup power"],
  },
  {
    id: "h2",
    title: "BlueNest Residence",
    location: "Adj. Main Road",
    price: "GHS 3,200 / semester",
    facilities: ["Water heater", "Security", "Laundry"],
  },
];
