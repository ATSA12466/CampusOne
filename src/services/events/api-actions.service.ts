import { z } from "zod";
import { apiClient, ApiError } from "../api/client";
import { eventActivitySchema, eventTicketSchema } from "../validation/event.schema";
import type { EventActionService } from "@/types/events";
import type { ServiceOptions } from "@/types/service-contracts";
const response = z.object({ ok: z.literal(true) }),
  encoded = (id: string) => encodeURIComponent(id);
const options = (input: ServiceOptions = {}) => ({
  headers: input.headers,
  cache: "no-store" as const,
  signal: input.signal
    ? AbortSignal.any([input.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000),
});
export const apiEventActions: EventActionService = {
  source: "api",
  async activity(input) {
    return apiClient("/events/activity", { ...options(input), schema: eventActivitySchema });
  },
  async rsvp(id, going, input) {
    await apiClient(`/events/${encoded(id)}/rsvp`, {
      ...options(input),
      method: going ? "PUT" : "DELETE",
      schema: response,
    });
    return { persisted: true };
  },
  async save(id, saved, input) {
    await apiClient(`/events/${encoded(id)}/saved`, {
      ...options(input),
      method: saved ? "PUT" : "DELETE",
      schema: response,
    });
    return { persisted: true };
  },
  async ticket(id, input) {
    const ticket = await apiClient(`/events/${encoded(id)}/ticket`, {
      ...options(input),
      schema: eventTicketSchema,
    });
    if (ticket.eventId !== id)
      throw new ApiError(
        "The service returned a ticket for another event. Please retry.",
        502,
        "VALIDATION",
      );
    return { ...ticket, source: "api" };
  },
};
