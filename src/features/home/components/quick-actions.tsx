import Link from "next/link";
import { BookOpen, Calendar, ClipboardPlus, Compass, Users } from "lucide-react";
import { Card } from "@/components/ui";

const actions = [
  { label: "Add Task", href: "/tasks", icon: ClipboardPlus },
  { label: "View Timetable", href: "/timetable", icon: Calendar },
  { label: "Resources", href: "/academics", icon: BookOpen },
  { label: "Explore Clubs", href: "/clubs", icon: Users },
  { label: "Discover", href: "/discover", icon: Compass },
];

export function QuickActions() {
  return (
    <Card>
      <h3 className="text-base font-semibold">Quick actions</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              prefetch={false}
              key={action.href}
              href={action.href}
              className="rounded-xl border border-[var(--color-border)] p-3 text-sm transition hover:border-brand/25 hover:bg-brand-soft"
            >
              <Icon size={16} className="mb-1 text-brand" />
              {action.label}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
