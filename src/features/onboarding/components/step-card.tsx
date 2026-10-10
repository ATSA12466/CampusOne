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
    <article className={`relative overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white ${accent}`}>
      <div className="mb-5 inline-flex rounded-2xl bg-white/20 p-3">
        <Icon size={24} />
      </div>
      <h2 className="text-3xl font-bold leading-tight text-balance">{title}</h2>
      <p className="mt-3 max-w-xl text-white/90">{description}</p>
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15" />
    </article>
  );
}
