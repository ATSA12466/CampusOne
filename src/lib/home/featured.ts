import type { Campaign, EventItem, Opportunity } from "@/types/engagement";
import type { FeaturedContentItem } from "@/types/home";
import { campusDate, isCampusDate } from "./schedule";
export function selectFeatured(
  items: readonly FeaturedContentItem[],
  campaigns: readonly Campaign[],
  now: Date,
) {
  const today = campusDate(now);
  return items
    .filter((item) => {
      if (!item.active) return false;
      if (item.sponsored || item.type === "sponsored") {
        const campaign = campaigns.find((ad) => ad.id === item.campaignId);
        return (
          !!campaign &&
          campaign.status === "active" &&
          campaign.placement.toLowerCase().includes("home") &&
          isCampusDate(campaign.startDate) &&
          isCampusDate(campaign.endDate) &&
          campaign.startDate <= today &&
          campaign.endDate >= today
        );
      }
      return item.type === "video" && !!item.mediaSource && !!item.transcript;
    })
    .sort(
      (a, b) =>
        Number(!!(b.sponsored || b.type === "sponsored")) -
        Number(!!(a.sponsored || a.type === "sponsored")),
    );
}
export const upcomingEvents = (events: readonly EventItem[], now: Date) =>
  events
    .filter((event) => isCampusDate(event.date) && event.date >= campusDate(now))
    .sort((a, b) => a.date.localeCompare(b.date));
export const openOpportunities = (items: readonly Opportunity[], now: Date) =>
  items
    .filter((item) => isCampusDate(item.deadline) && item.deadline >= campusDate(now))
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
