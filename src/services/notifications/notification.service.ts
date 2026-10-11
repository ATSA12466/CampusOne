import type { ServiceOptions } from "@/types/service-contracts";
export const notificationService = {
  async read(ids: string[], options?: ServiceOptions) {
    return (await import("./notification-actions")).notificationActions.read(
      ids,
      options,
    );
  },
};
