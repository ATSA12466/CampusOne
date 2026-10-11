import { z } from "zod";
import { membershipNoteSchema } from "@/services/validation/club.schema";
export { membershipNoteSchema };
export const membershipRequestSchema = z.object({
  note: membershipNoteSchema,
  acknowledged: z
    .boolean()
    .refine((value) => value, "Please acknowledge where this request will be saved."),
});
export type MembershipRequestValues = z.infer<typeof membershipRequestSchema>;
