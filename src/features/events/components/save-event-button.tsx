import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
export function SaveEventButton({
  name,
  saved,
  disabled,
  onSave,
  overlay = false,
}: {
  name: string;
  saved: boolean;
  disabled: boolean;
  onSave: () => void;
  overlay?: boolean;
}) {
  return (
    <Button
      size="icon"
      variant={overlay ? "overlay" : "secondary"}
      className="absolute top-3 right-3 z-10"
      aria-label={`${saved ? "Unsave" : "Save"} ${name}`}
      aria-pressed={saved}
      disabled={disabled}
      onClick={onSave}
    >
      <Bookmark className="size-4" fill={saved ? "currentColor" : "none"} aria-hidden="true" />
    </Button>
  );
}
