import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
export function SaveClubButton({
  name,
  saved,
  disabled,
  onSave,
  overlay = false,
}: {
  name: string;
  saved: boolean;
  disabled?: boolean;
  onSave: () => void;
  overlay?: boolean;
}) {
  return (
    <Button
      size="icon"
      variant={overlay ? "secondary" : "ghost"}
      className={overlay ? "absolute top-3 right-3 z-10 shadow-low" : ""}
      aria-label={`${saved ? "Unsave" : "Save"} ${name}`}
      aria-pressed={saved}
      disabled={disabled}
      onClick={onSave}
    >
      <Bookmark className="size-4" fill={saved ? "currentColor" : "none"} aria-hidden="true" />
    </Button>
  );
}
