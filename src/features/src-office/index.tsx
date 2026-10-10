import { PageHeader } from "@/components/shared/page-header";
import { engagementService } from "@/services";
import { SrcProjectsPanel } from "./components/src-projects-panel";
import { SrcRepresentativesPanel } from "./components/src-representatives-panel";
import { SrcRequestForm } from "./components/src-request-form";

export function SrcOfficeFeature() {
  const projects = engagementService.listSrcProjects();
  const representatives = engagementService.listRepresentatives();

  return (
    <div className="space-y-4">
      <PageHeader
        title="SRC Office"
        description="Leadership, projects, student requests, and representation updates."
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <SrcProjectsPanel projects={projects} />
        <SrcRepresentativesPanel representatives={representatives} />
      </div>
      <SrcRequestForm />
    </div>
  );
}
