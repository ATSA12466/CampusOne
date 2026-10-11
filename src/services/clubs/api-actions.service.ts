import type { ServiceOptions } from "@/types/service-contracts";
import { z } from "zod";
import { apiClient } from "../api/client";
import { clubActivitySchema } from "../validation/club.schema";
import type { ClubActionService } from "@/types";
import { membershipNoteSchema } from "@/services/validation/club.schema";
const response = z.object({ ok: z.literal(true) });
function settings(input: ServiceOptions = {}) {
  return {
    headers: input.headers,
    signal: input.signal
      ? AbortSignal.any([input.signal, AbortSignal.timeout(10000)])
      : AbortSignal.timeout(10000),
    cache: "no-store" as const,
  };
}
const encoded = (id: string) => encodeURIComponent(id);
export const apiClubActions: ClubActionService = {
  source: "api",
  async activity(options) {
    return apiClient("/clubs/activity", { ...settings(options), schema: clubActivitySchema });
  },
  async request(id, note, options) {
    await apiClient(`/clubs/${encoded(id)}/membership`, {
      ...settings(options),
      method: "POST",
      body: JSON.stringify({ note: membershipNoteSchema.parse(note) }),
      schema: response,
    });
    return { persisted: true };
  },
  async withdraw(id, options) {
    await apiClient(`/clubs/${encoded(id)}/membership`, {
      ...settings(options),
      method: "DELETE",
      schema: response,
    });
    return { persisted: true };
  },
  async review(id, status, options) {
    await apiClient(`/clubs/memberships/${encoded(id)}`, {
      ...settings(options),
      method: "PATCH",
      body: JSON.stringify({ status }),
      schema: response,
    });
    return { persisted: true };
  },
  async save(id, saved, options) {
    await apiClient(`/clubs/${encoded(id)}/saved`, {
      ...settings(options),
      method: saved ? "PUT" : "DELETE",
      schema: response,
    });
    return { persisted: true };
  },
};
