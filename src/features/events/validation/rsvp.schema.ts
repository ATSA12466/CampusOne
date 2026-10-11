import { z } from "zod";
export const rsvpSchema = z.object({
  acknowledged: z
    .boolean()
    .refine((value) => value, "Please acknowledge where this RSVP will be saved."),
});
export type RsvpValues = z.infer<typeof rsvpSchema>;
