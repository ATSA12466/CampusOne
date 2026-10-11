import { StudentNotes } from "./components/student-notes";
import { GpaCalculator } from "./components/gpa-calculator";
export function AcademicsFeature() {
  return (
    <div className="space-y-6">
      <GpaCalculator />
      <StudentNotes />
    </div>
  );
}
