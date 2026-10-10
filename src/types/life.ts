export interface MarketplaceListing {
  id: string;
  title: string;
  category: string;
  priceLabel: string;
  description: string;
}

export interface LostFoundReport {
  id: string;
  type: "lost" | "found";
  item: string;
  location: string;
  date: string;
  status: "open" | "claimed";
}

export interface AccommodationListing {
  id: string;
  title: string;
  location: string;
  price: string;
  facilities: string[];
}

export interface MediaItem {
  id: string;
  title: string;
  kind: "podcast" | "video" | "audio";
  creator: string;
  duration: string;
  source?: string;
  thumbnail: string;
}
