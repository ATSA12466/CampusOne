export interface PhotoRecord {
  id: string;
  title: string;
  description: string;
  photo: string;
  createdAt: string;
  category: string;
  location: string;
  priceValue: number;
  type: "listing" | "lost" | "found";
  status: "open" | "closed";
}
