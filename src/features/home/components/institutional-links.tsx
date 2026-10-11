import { ArrowUpRight, BookOpen, GraduationCap } from "lucide-react";
import { institutionalLinks } from "@/config/home";
export function InstitutionalLinks() {
  return (
    <section
      aria-labelledby="home-portals-title"
      className="rounded-card border border-border bg-surface p-5 md:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="home-portals-title" className="text-sm font-semibold">
          The important tabs, right here.
        </h2>
        <span className="text-[10px] text-muted-foreground">External university portals</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {institutionalLinks.map((item) => {
          const Icon = item.id === "lms" ? BookOpen : GraduationCap;
          return (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${item.id === "lms" ? "GCTU LMS" : "GCTU SIP"} in a new tab`}
              className="group flex min-h-20 items-center gap-3 rounded-control border border-border bg-surface-muted p-4 transition-colors hover:border-control-border hover:bg-brand-soft"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-control bg-surface text-brand">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{item.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{item.description}</span>
              </span>
              <ArrowUpRight className="size-5 shrink-0 text-brand" aria-hidden="true" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
