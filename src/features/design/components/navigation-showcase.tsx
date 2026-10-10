import { ShowcaseSection } from "./showcase-section";
import { ChoicePreview } from "./choice-preview";
import { OverlayPreview } from "./overlay-preview";
export function NavigationShowcase() {
  return (
    <ShowcaseSection
      id="navigation"
      number="05"
      title="The right thing, within reach."
      description="Arrow-key tabs and choice groups. Focus-trapped dialogs that close with Escape and return you to the trigger. Menus that work without a mouse."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <ChoicePreview />
        <OverlayPreview />
      </div>
    </ShowcaseSection>
  );
}
