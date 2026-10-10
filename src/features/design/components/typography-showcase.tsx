import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ShowcaseSection } from "./showcase-section";

export function TypographyShowcase() {
  return (
    <ShowcaseSection
      id="type"
      number="02"
      title="Editorial soul. Everyday clarity."
      description="Fraunces brings a little campus-magazine character. Manrope keeps everyday tasks, names and numbers effortless. Both are licensed and served locally."
    >
      <div className="grid gap-5 lg:grid-cols-5">
        <Card padding="lg" className="lg:col-span-3">
          <Badge tone="gold">Fraunces · display</Badge>
          <p className="mt-5 font-display text-title font-medium text-balance">
            Small moments.
            <br />A bigger campus life.
          </p>
          <p className="mt-6 font-display text-xl">Aa Bb Cc · 0123456789</p>
        </Card>
        <Card padding="lg" className="lg:col-span-2">
          <Badge tone="primary">Manrope · text</Badge>
          <p className="mt-5 text-xl font-semibold">For the moments in between.</p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Ama Nyarko, Kojo Mensah, Dzidzɔ. A resource for Database Systems. A club that feels like
            home. Copy that gets out of your way.
          </p>
          <p className="mt-5 text-2xl font-semibold tabular-nums">GH₵ 2,800.00</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Extended Latin and cedi glyphs included.
          </p>
        </Card>
      </div>
      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 text-xs text-muted-foreground">
        <span>Display / 44–84</span>
        <span>Title / 32–52</span>
        <span>Heading / 24–36</span>
        <span>Body / 16</span>
        <span>Label / 14</span>
        <span>Metadata / 12</span>
      </div>
    </ShowcaseSection>
  );
}
