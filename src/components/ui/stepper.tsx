import { Check } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const circle = cva(
  "mx-auto grid size-11 place-items-center rounded-full border text-sm font-semibold",
  {
    variants: {
      state: {
        complete: "border-brand bg-brand text-on-brand",
        current: "border-brand bg-brand-soft text-brand",
        upcoming: "border-border bg-surface text-muted-foreground",
      },
    },
    defaultVariants: { state: "upcoming" },
  },
);
export function Stepper({
  steps,
  current,
  label = "Progress",
  onStepChange,
}: {
  steps: readonly string[];
  current: number;
  label?: string;
  onStepChange?: (index: number) => void;
}) {
  return (
    <ol
      aria-label={label}
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${Math.max(1, steps.length)}, minmax(0, 1fr))` }}
    >
      {steps.map((step, index) => {
        const state = index < current ? "complete" : index === current ? "current" : "upcoming";
        const content = (
          <>
            <span aria-hidden="true" className={circle({ state })}>
              {index < current ? <Check className="size-4" /> : index + 1}
            </span>
            <span className="mt-2 block text-xs font-medium">{step}</span>
          </>
        );
        return (
          <li
            key={`${step}-${index}`}
            aria-current={index === current ? "step" : undefined}
            className="min-w-0 text-center"
          >
            {onStepChange ? (
              <button
                type="button"
                className={cn(
                  "w-full rounded-control p-1",
                  index > current ? "text-muted-foreground" : "text-foreground",
                )}
                aria-label={`${step}, step ${index + 1}, ${state}`}
                onClick={() => onStepChange(index)}
              >
                {content}
              </button>
            ) : (
              <div>
                {content}
                <span className="sr-only"> — {state}</span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
