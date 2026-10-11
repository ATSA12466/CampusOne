import type { TaskItem } from "@/types/productivity";
import type { ServiceOptions } from "@/types/service-contracts";
let selected: Promise<typeof import("./task-actions")> | null = null;
function actions() {
  return (selected ??= import("./task-actions").catch((cause: unknown) => {
    selected = null;
    throw cause;
  }));
}
export const taskService = {
  async list(
    options?: ServiceOptions,
  ): Promise<{ items: TaskItem[]; total: number }> {
    return (await actions()).taskActions.list(options);
  },
  async put(item: TaskItem, options?: ServiceOptions) {
    return (await actions()).taskActions.put(item, options);
  },
  async remove(id: string, options?: ServiceOptions) {
    return (await actions()).taskActions.remove(id, options);
  },
};
