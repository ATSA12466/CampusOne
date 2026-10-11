import type { ProfilePreferences } from "@/types/profile";
import type { ServiceOptions } from "@/types/service-contracts";
export const profileService = {
  async save(input: ProfilePreferences, options?: ServiceOptions) {
    return (await import("./profile-actions")).profileActions.save(input, options);
  },
};
