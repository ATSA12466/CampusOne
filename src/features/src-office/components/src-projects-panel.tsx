import { Badge, Card } from "@/components/ui";
import type { SRCProject } from "@/types";

export function SrcProjectsPanel({ projects }: { projects: SRCProject[] }) {
  return (
    <Card>
      <h2 className="font-semibold">Current projects</h2>
      <ul className="mt-3 space-y-3 text-sm">
        {projects.map((project) => (
          <li key={project.id} className="rounded-xl border border-[var(--color-border)] p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-foreground">{project.title}</p>
              <Badge
                tone={
                  project.status === "active"
                    ? "success"
                    : project.status === "in-progress"
                      ? "primary"
                      : "warning"
                }
              >
                {project.status}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{project.summary}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
