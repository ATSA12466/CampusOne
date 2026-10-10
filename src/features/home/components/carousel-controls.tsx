import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";

export function CarouselControls({
  onPrevious,
  onNext,
}: {
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={onPrevious} aria-label="Previous featured content">
        <ChevronLeft size={16} />
      </Button>
      <Button variant="secondary" onClick={onNext} aria-label="Next featured content">
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
