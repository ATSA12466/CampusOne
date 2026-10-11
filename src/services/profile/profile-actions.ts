import { useAuthStore } from "@/stores/auth-store";
import { workspaceService } from "../workspace/workspace.service";
import { profileInputSchema } from "../validation/profile.schema";
import type { ProfilePreferences } from "@/types/profile";
import type { ServiceOptions } from "@/types/service-contracts";
const owner = () => {
  const s = useAuthStore.getState();
  return s.user && s.hydrated
    ? `${s.source}:${s.user.id}:${s.user.email.toLowerCase()}:${s.role}`
    : "";
};
export const profileActions = {
  async save(input: ProfilePreferences, options: ServiceOptions = {}) {
    const expected = owner();
    if (!expected) throw new Error("Sign in to edit your profile.");
    const { id, photo, ...fields } = input;
    profileInputSchema.parse(fields);
    const result = await workspaceService.put(
      "profile",
      { ...fields, id, ...(photo ? { photo } : {}) },
      options,
    );
    options.signal?.throwIfAborted();
    if (expected !== owner())
      throw new Error(
        "The account changed; refresh your profile before editing.",
      );
    const current = useAuthStore.getState();
    if (current.source === "demo" && current.user)
      current.setDemoProfile({
        ...current.user,
        name: fields.name,
        programme: fields.programme,
        level: fields.level,
      });
    return result;
  },
};
