import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { campusService } from "@/services";
import { PaletteShowcase } from "./components/palette-showcase";
import { TypographyShowcase } from "./components/typography-showcase";
import { MediaShowcase } from "./components/media-showcase";
import { ControlsShowcase } from "./components/controls-showcase";
import { NavigationShowcase } from "./components/navigation-showcase";
import { DataShowcase } from "./components/data-showcase";
import { StatesShowcase } from "./components/states-showcase";
import { UploadShowcase } from "./components/upload-showcase";

const sections = [
  { id: "identity", label: "Identity" },
  { id: "type", label: "Type" },
  { id: "media", label: "Media" },
  { id: "controls", label: "Controls" },
  { id: "navigation", label: "Navigation" },
  { id: "data", label: "Progress" },
  { id: "states", label: "States" },
  { id: "uploads", label: "Uploads" },
];
export async function DesignFeature() {
  const [clubs, events] = await Promise.all([
    campusService.list("clubs", { pageSize: 2 }),
    campusService.list("events", { pageSize: 2 }),
  ]);
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <Link href="/home" aria-label="CampusOne home">
            <BrandMark />
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="hidden sm:inline">
              <Badge tone="primary">Design foundations / 02</Badge>
            </span>
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <main id="design-main" className="mx-auto max-w-7xl px-4 md:px-8">
        <section className="py-12 md:py-20">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold tracking-[0.2em] text-brand uppercase">
              The CampusOne design system
            </span>
            <span className="h-px w-10 bg-border" />
            <span className="text-xs text-muted-foreground">Made for GCTU student life</span>
          </div>
          <h1 className="max-w-4xl font-display text-display font-medium text-balance">
            A little more campus.
            <br />
            <span className="italic">A lot more you.</span>
          </h1>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              An editorial, photo-centered foundation for a connected student experience. Considered
              details. Comfortable interactions. A place that feels like yours.
            </p>
            <Button asChild variant="secondary">
              <Link href="/home">
                Open the current app <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <nav
            aria-label="Design system sections"
            className="mt-10 flex gap-1 overflow-x-auto border-y border-border py-2"
          >
            {sections.map((section) => (
              <a
                href={`#${section.id}`}
                key={section.id}
                className="inline-flex min-h-11 shrink-0 items-center rounded-control px-3 text-xs font-semibold text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              >
                {section.label}
              </a>
            ))}
          </nav>
        </section>
        <PaletteShowcase />
        <TypographyShowcase />
        <MediaShowcase clubs={clubs.items} events={events.items} />
        <ControlsShowcase />
        <NavigationShowcase />
        <DataShowcase />
        <StatesShowcase />
        <UploadShowcase />
      </main>
      <footer className="mt-6 border-t border-border px-4 py-10 text-center">
        <p className="font-display text-2xl font-semibold">Your campus, connected.</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Phase 2 / Development-only showcase · Generated demonstration photography · Official SRC
          artwork pending
        </p>
      </footer>
    </div>
  );
}
