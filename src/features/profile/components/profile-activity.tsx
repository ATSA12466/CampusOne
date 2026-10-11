"use client";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { appConfig } from "@/config/app-config";
import { useAppStore } from "@/stores/app-store";
const links = [
  {
    href: "/discover?view=saved",
    title: "Your saved finds",
    text: "A little collection of things worth coming back to.",
  },
  {
    href: "/participation",
    title: "Campus connections",
    text: "Club requests and events you have chosen to attend.",
  },
  {
    href: "/academics",
    title: "Your study space",
    text: "Private notes, resources and your grade planner.",
  },
  {
    href: "/calendar",
    title: "The week ahead",
    text: "Classes, tasks and personal plans in one place.",
  },
] as const;
export function ProfileActivity() {
  const saved = useAppStore((s) => s.bookmarks.length),
    tasks = useAppStore((s) => s.tasks.filter((t) => !t.completed).length);
  return (
    <section aria-label="Your profile shortcuts" className="space-y-5">
      <h2 className="font-display text-2xl font-semibold">
        A little more you.
      </h2>
      {appConfig.dataSource === "demo" ? (
        <p className="text-sm text-muted-foreground">
          {saved} saved finds · {tasks} open tasks · local demo activity, not
          official participation.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Open each space for current publisher-owned activity. Local demo
          counts are not shown in API mode.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <Card key={link.href}>
            <h3 className="font-display text-xl font-semibold">{link.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{link.text}</p>
            <Link
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand"
              href={link.href}
            >
              Open this space →
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
