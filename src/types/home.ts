export type FeaturedContentType =
  | "video"
  | "audio"
  | "sponsored"
  | "highlight"
  | "opportunity"
  | "announcement";

export interface FeaturedContentItem {
  id: string;
  title: string;
  description: string;
  type: FeaturedContentType;
  thumbnail: string;
  mediaSource?: string;
  creator?: string;
  duration?: string;
  ctaLabel?: string;
  destination: string;
  sponsored?: boolean;
  active: boolean;
}
