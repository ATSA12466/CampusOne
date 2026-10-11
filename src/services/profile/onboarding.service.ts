import { images } from "@/config/images";
import { demoAuthService } from "../auth/demo-auth.service";
import type { OnboardingService } from "@/types/auth";
export const onboardingService: OnboardingService = {
  personalizeDemo(user, preferences) {
    const base = user ?? { ...demoAuthService.initialUser(), id: `local-${crypto.randomUUID()}` };
    return {
      ...base,
      name: preferences.name.trim(),
      programme: preferences.programme,
      level: preferences.level,
      avatar:
        preferences.portrait === "ama"
          ? images.studentAma.src
          : preferences.portrait === "kojo"
            ? images.studentKojo.src
            : undefined,
    };
  },
};
