import type { ReactNode } from "react";

export function ShowcaseSection({
  id,
  number,
  title,
  description,
  children,
}: {
  id: string;
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 border-t border-border py-10 md:py-14"
    >
      <div className="mb-7 flex items-start gap-4">
        <span className="mt-1 text-[11px] font-semibold tracking-widest text-brand">{number}</span>
        <div>
          <h2
            id={`${id}-title`}
            className="font-display text-3xl font-semibold tracking-tight md:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
