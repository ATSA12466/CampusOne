import { Card } from "@/components/ui";
import type { Representative } from "@/types";

export function SrcRepresentativesPanel({ representatives }: { representatives: Representative[] }) {
  return (
    <Card>
      <h2 className="font-semibold">Leadership & representatives</h2>
      <ul className="mt-3 space-y-3 text-sm">
        {representatives.map((representative) => (
          <li key={representative.id} className="rounded-xl border border-[var(--color-border)] p-3">
            <p className="font-medium text-slate-900">{representative.name}</p>
            <p className="text-slate-600">{representative.role}</p>
            <p className="mt-1 text-slate-600">{representative.responsibility}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
