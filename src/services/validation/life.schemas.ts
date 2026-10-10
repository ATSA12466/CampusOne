import { z } from "zod";
const text = z.string();
export const lifeSchemas = {
  accommodation: z.object({
    id: text,
    title: text,
    location: text,
    price: text,
    facilities: z.array(text),
  }),
  marketplace: z.object({
    id: text,
    title: text,
    category: text,
    priceLabel: text,
    description: text,
  }),
  lostFound: z.object({
    id: text,
    type: z.enum(["lost", "found"]),
    item: text,
    location: text,
    date: text,
    status: z.enum(["open", "claimed"]),
  }),
  media: z.object({
    id: text,
    title: text,
    kind: z.enum(["podcast", "video", "audio"]),
    creator: text,
    duration: text,
    source: text.optional(),
    thumbnail: text,
  }),
};
