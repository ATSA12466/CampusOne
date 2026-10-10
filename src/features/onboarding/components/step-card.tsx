import type { ComponentType } from "react";

export function StepCard({
  title,
  description,
  accent,
  Icon,
}: {
  title: string;
  description: string;
  accent: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <article
      className="brand-gradient relative overflow-hidden rounded-media p-8 text-on-photo"
      data-accent={accent}
    >
      <div aria-hidden="true" className="mb-5 inline-flex rounded-2xl bg-on-photo/20 p-3">
        <Icon size={24} />
      </div>
      <h2 className="text-3xl font-bold leading-tight text-balance">{title}</h2>
      <p className="mt-3 max-w-xl text-on-photo/90">{description}</p>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-on-photo/15"
      />
    </article>
  );
}
