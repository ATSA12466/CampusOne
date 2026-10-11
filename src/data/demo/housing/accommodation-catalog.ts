import { images } from "@/config/images";
import type { AccommodationListing } from "@/types";
import type { ListingDetails } from "@/types/listings";
export const housingDetails = (title: string, n: number): ListingDetails => ({
  intro: `A fictional student home with room for studying, resting and finding your routine.`,
  body: [
    `${title} is an illustrative CampusOne listing, not a verified accommodation business. Arrange an independent viewing and confirm availability, rent period and written terms before any payment.`,
    `Share a study-friendly space, check water and power arrangements, and ask about quiet hours, accessibility and any extra fees. Prices and walking times are fictional demo facts.`,
  ],
  gallery: [
    n % 2 ? images.housingRoom : images.campusLiving,
    n % 2 ? images.campusLiving : images.housingRoom,
    images.studyCorner,
  ],
  kind: n % 3 === 0 ? "Studio" : n % 3 === 1 ? "Shared room" : "Single room",
  owner: "Fictional CampusOne housing desk",
  tags: ["Viewing recommended", "Student housing"],
  priceValue: 2400 + n * 200,
  walkMinutes: 5 + n,
});
const titles = [
  "Palm Court Rooms",
  "Tesano Study House",
  "Garden Lane Residence",
  "Sunrise Student Lodge",
  "Quiet Corner Studios",
  "Akwaaba Shared House",
  "Green Court Hostel",
  "Library Lane Rooms",
  "Courtyard Residence",
  "North Gate Studio",
];
export const extraAccommodations: AccommodationListing[] = titles.map(
  (title, n) => ({
    id: `h${n + 3}`,
    title,
    location:
      n % 2
        ? "Tesano, Accra (fictional address)"
        : "Near campus (fictional address)",
    price: `GH₵ ${(2400 + n * 200).toLocaleString("en-GH")} / semester`,
    facilities:
      n % 2
        ? ["Wi-Fi", "Shared kitchen", "Study room"]
        : ["Security", "Water storage", "Laundry"],
    details: housingDetails(title, n),
  }),
);
