import type { GradeEntry } from "@/types/academic-tools";
export function weightedGpa(entries: readonly GradeEntry[]) {
  const credits = entries.reduce((s, e) => s + e.credits, 0),
    quality = entries.reduce((s, e) => s + e.credits * e.points, 0);
  return {
    credits,
    quality,
    gpa: credits ? Math.round((quality / credits) * 100) / 100 : null,
  };
}
