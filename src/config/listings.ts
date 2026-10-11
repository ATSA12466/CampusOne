import { images } from "./images";
import type { ListingDomain } from "@/types/listings";
export const listingConfig = {
  accommodation: {
    title: "A place to call your own.",
    subtitle: "Find a little space for your next chapter.",
    label: "Accommodation",
    image: images.campusLiving,
    action: "Enquire about this place",
  },
  marketplace: {
    title: "Good finds. New beginnings.",
    subtitle: "Useful things, passed from one student to another.",
    label: "Marketplace",
    image: images.campusMarket,
    action: "Ask about this listing",
  },
  opportunities: {
    title: "Your next door is open.",
    subtitle: "Scholarships, internships and chances to try something new.",
    label: "Opportunities",
    image: images.clubMakers,
    action: "Prepare an application",
  },
  resources: {
    title: "A little more understanding.",
    subtitle: "Resources for your next bright idea.",
    label: "Academics",
    image: images.studyCorner,
    action: "Save study notes",
  },
} as const satisfies Record<ListingDomain, object>;
