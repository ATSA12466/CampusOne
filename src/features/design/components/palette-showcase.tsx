import { theme } from "@/config/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ShowcaseSection } from "./showcase-section";

const colors = [
  { label: "Midnight", color: "var(--nav)", text: "var(--on-photo)" },
  { label: "Royal", color: theme.colors.brand, text: "var(--brand-foreground)" },
  { label: "Sunshine", color: theme.colors.accent, text: "var(--accent-foreground)" },
  { label: "Teal", color: theme.colors.success, text: "var(--surface)" },
];
export function PaletteShowcase() {
  return (
    <ShowcaseSection
      id="identity"
      number="01"
      title="Rooted here. Ready for what's next."
      description="The existing navy, royal blue, gold and teal family, evolved into semantic surfaces. Official SRC artwork has a reserved slot, never a substitute emblem."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {colors.map((color) => (
          <div
            key={color.label}
            className="flex h-32 flex-col justify-between rounded-media p-5"
            style={{ backgroundColor: color.color, color: color.text }}
          >
            <span className="text-xs font-medium">CampusOne</span>
            <span className="font-display text-2xl font-semibold">{color.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={mode}
            data-theme={mode}
            className="rounded-media border border-border bg-background p-5 text-foreground"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {mode} / surface study
              </p>
              <Badge tone="success">Connected</Badge>
            </div>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <Avatar name="Ama Nyarko" />
                <div>
                  <p className="text-sm font-semibold">A place to belong</p>
                  <p className="text-xs text-muted-foreground">
                    Light and dark, equally considered.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm">Find your people</Button>
                <Button variant="secondary" size="sm">
                  Explore
                </Button>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </ShowcaseSection>
  );
}
