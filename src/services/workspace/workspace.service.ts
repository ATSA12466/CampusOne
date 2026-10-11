import { appConfig } from "@/config/app-config";
import type { WorkspaceService } from "@/types/workspace";
let selected: Promise<WorkspaceService> | null = null;
const get = () =>
  (selected ??= import("./workspace-actions")
    .then((m) => m.workspaceService)
    .catch((error: unknown) => {
      selected = null;
      throw error;
    }));
export const workspaceService: WorkspaceService = {
  source: appConfig.dataSource,
  async list(collection, options) {
    return (await get()).list(collection, options);
  },
  async put(collection, item, options) {
    return (await get()).put(collection, item, options);
  },
  async remove(collection, id, options) {
    return (await get()).remove(collection, id, options);
  },
};
