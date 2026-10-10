import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui";
import { productivityService } from "@/services/demo";

export function TimetableFeature() {
  const sessions = productivityService.listTimetableSessions();
  if (!sessions.length) {
    return <EmptyState title="No timetable yet" description="Add your first class session to get started." />;
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Timetable" description="Demo timetable data. Official institutional schedule will be backend-supplied." />
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-slate-500">
                <th className="py-2">Day</th>
                <th>Course</th>
                <th>Time</th>
                <th>Venue</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-[var(--color-border)]">
                  <td className="py-2">{session.day}</td>
                  <td>{session.course}</td>
                  <td>{session.start} - {session.end}</td>
                  <td>{session.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
