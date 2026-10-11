import { BookOpen, CalendarDays, HeartHandshake, Compass, ShieldCheck } from "lucide-react";
const highlights = [
  {
    Icon: Compass,
    title: "A campus worth exploring",
    text: "Photo stories, useful shortcuts, LMS/SIP links and a magazine-style Home.",
  },
  {
    Icon: BookOpen,
    title: "Make a little room for focus",
    text: "Course resources, your device-only tasks and the supplied class schedule.",
  },
  {
    Icon: HeartHandshake,
    title: "Good people. Shared interests.",
    text: "Find clubs, preview membership requests and see the next campus event.",
  },
  {
    Icon: CalendarDays,
    title: "Your next chapter",
    text: "Explore student opportunities and the parts of campus life you care about.",
  },
];
export function IntroHighlights({ step }: { step: number }) {
  const selected =
    step === 0 ? highlights.slice(0, 3) : [highlights[step === 1 ? 1 : step === 2 ? 2 : 3]];
  return (
    <div className="space-y-4">
      {selected.map(({ Icon, title, text }) => (
        <div
          key={title}
          className="flex items-start gap-4 rounded-card border border-border bg-surface p-4"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{text}</p>
          </div>
        </div>
      ))}
      <div className="flex items-start gap-3 rounded-control bg-surface-muted p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
        <p>
          Independent prototype, not an official GCTU/SRC service. Demo accounts, sample photos and
          device-only actions are always labelled.
        </p>
      </div>
    </div>
  );
}
