import type { AcademicsReadService } from "@/types/service-contracts";
import { courses, resources } from "@/data/demo/academics/resources";

export const academicsService = {
  listCourses: () => courses,
  listResources: () => resources,
  getResourceById: (id: string) => resources.find((resource) => resource.id === id),
} satisfies AcademicsReadService;
