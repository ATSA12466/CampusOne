import { appConfig } from "@/config/app-config";
import type { CampusActionService } from "@/types/campus-operations";
let selected: Promise<CampusActionService> | null = null;
const get = () =>
  (selected ??= import("./campus-actions")
    .then((m) => m.campusActions)
    .catch((cause: unknown) => {
      selected = null;
      throw cause;
    }));
export const campusActionService: CampusActionService = {
  source: appConfig.dataSource,
  async activity(o) {
    return (await get()).activity(o);
  },
  async saveAnnouncement(id, saved, o) {
    return (await get()).saveAnnouncement(id, saved, o);
  },
  async submitRequest(input, o) {
    return (await get()).submitRequest(input, o);
  },
};
