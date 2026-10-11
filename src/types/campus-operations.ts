import type { StudentRequest } from "./engagement";
import type { ServiceOptions } from "./service-contracts";
export interface CampusActivity {
  savedAnnouncementIds: string[];
  requests: StudentRequest[];
}
export type RequestInput = Pick<
  StudentRequest,
  "title" | "category" | "description"
>;
export interface CampusActionService {
  readonly source: "demo" | "api";
  activity(options?: ServiceOptions): Promise<CampusActivity>;
  saveAnnouncement(
    id: string,
    saved: boolean,
    options?: ServiceOptions,
  ): Promise<{ persisted: boolean }>;
  submitRequest(
    input: RequestInput,
    options?: ServiceOptions,
  ): Promise<{ persisted: boolean }>;
}
