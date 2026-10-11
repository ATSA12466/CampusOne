import { appConfig } from "@/config/app-config";
import type { EventActionService } from "@/types/events";
let selected: Promise<EventActionService> | undefined;
const get = () =>
  (selected ??= (
    appConfig.dataSource === "api"
      ? import("./api-actions.service").then((m) => m.apiEventActions)
      : import("./demo-actions.service").then((m) => m.demoEventActions)
  ).catch((error: unknown) => {
    selected = undefined;
    throw error;
  }));
export const eventActionService: EventActionService = {
  source: appConfig.dataSource,
  async activity(options) {
    return (await get()).activity(options);
  },
  async rsvp(id, going, options) {
    return (await get()).rsvp(id, going, options);
  },
  async save(id, saved, options) {
    return (await get()).save(id, saved, options);
  },
  async ticket(id, options) {
    return (await get()).ticket(id, options);
  },
};
