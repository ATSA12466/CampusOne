import { Bookmark } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EnquiryDialog } from "@/features/listings/components/enquiry-dialog";
import type { DiscoverItem } from "@/types/discover";
export function ReportCard({
  item,
  saved,
  disabled,
  onSave,
}: {
  item: DiscoverItem;
  saved: boolean;
  disabled: boolean;
  onSave: () => void;
}) {
  return (
    <article
      data-report-id={item.id}
      className="overflow-hidden rounded-media border border-border bg-surface shadow-low"
    >
      <div className="relative">
        <CampusImage image={item.cover} />
        <Button
          aria-label={`${saved ? "Unsave" : "Save"} ${item.title}`}
          aria-pressed={saved}
          variant="overlay"
          size="icon"
          disabled={disabled}
          onClick={onSave}
          className="absolute top-3 right-3"
        >
          <Bookmark className="size-4" aria-hidden="true" />
        </Button>
        <p className="absolute bottom-2 left-2 rounded-full bg-nav/85 px-2 py-1 text-[10px] text-on-photo">
          Category illustration · not the reported item
        </p>
      </div>
      <div className="space-y-3 p-5">
        <h3 className="font-display text-xl font-semibold">{item.title}</h3>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <dl className="space-y-2 text-sm">
          {item.facts.map((f) => (
            <div key={f.label} className="flex justify-between gap-3">
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
        <Dialog
          title={item.title}
          description="Fictional demonstration report. Do not publish ID numbers, private contact details or unredacted documents."
          trigger={<Button variant="secondary">View report</Button>}
        >
          <p className="text-sm">{item.description}</p>
          <div className="mt-4">
            <EnquiryDialog
              domain="lost-found"
              id={item.id}
              title="Prepare a safe claim / contact note"
            />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Describe the item privately and arrange any real handover with a
            trusted campus desk. Device drafts are not delivered.
          </p>
        </Dialog>
      </div>
    </article>
  );
}
