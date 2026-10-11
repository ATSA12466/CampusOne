import type { StudyPlan, StudyPlannerInput } from "@/types/study-planner";
export const studyPlannerService = {
  async generate(input: StudyPlannerInput): Promise<StudyPlan> {
    const [{ studyInputSchema, studyPlanSchema }, { studySessions }] =
      await Promise.all([
        import("@/services/validation/study.schema"),
        import("@/lib/study/planner"),
      ]);
    const valid = studyInputSchema.parse(input);
    return studyPlanSchema.parse({
      ...valid,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      sessions: studySessions(valid),
    });
  },
};
