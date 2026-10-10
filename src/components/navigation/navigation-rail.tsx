import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { primaryNav, workspaceNav } from "./nav-config";
import { cn } from "@/lib/utils/cn";
export function NavigationRail({ isActive }: { isActive: (href: string) => boolean }) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto border-r border-border bg-nav p-4 text-nav-foreground lg:block">
      <Link
        prefetch={false}
        href="/home"
        className="mb-7 flex min-h-11 items-center rounded-control"
      >
        <BrandMark tone="inverse" size="sm" />
      </Link>
      <nav aria-label="Primary navigation" className="space-y-1">
        {primaryNav.map((item) => (
          <Link
            prefetch={false}
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors",
              isActive(item.href)
                ? "bg-nav-hover text-nav-foreground"
                : "text-nav-muted hover:bg-nav-hover",
            )}
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 border-t border-nav-muted/25 pt-4">
        <p className="mb-2 text-[10px] font-semibold tracking-widest text-nav-muted uppercase">
          My Workspace
        </p>
        <nav aria-label="My workspace" className="space-y-1">
          {workspaceNav.map((item) => (
            <Link
              prefetch={false}
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-nav-hover text-nav-foreground"
                  : "text-nav-muted hover:bg-nav-hover",
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
