import { appConfig } from "@/config/app-config";
import type { ClubActionService } from "@/types/clubs";
let selected: Promise<ClubActionService> | undefined;
const get = () =>
  (selected ??= (
    appConfig.dataSource === "api"
      ? import("./api-actions.service").then((m) => m.apiClubActions)
      : import("./demo-actions.service").then((m) => m.demoClubActions)
  ).catch((error: unknown) => {
    selected = undefined;
    throw error;
  }));
export const clubActionService: ClubActionService = {
  source: appConfig.dataSource,
  async activity(options) {
    return (await get()).activity(options);
  },
  async request(id, note, options) {
    return (await get()).request(id, note, options);
  },
  async withdraw(id, options) {
    return (await get()).withdraw(id, options);
  },
  async review(id, status, options) {
    return (await get()).review(id, status, options);
  },
  async save(id, saved, options) {
    return (await get()).save(id, saved, options);
  },
};
