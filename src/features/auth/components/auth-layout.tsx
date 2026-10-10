import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-bg)] px-4 py-10">
      <section className="campus-card w-full max-w-md p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/home" className="inline-flex min-h-11 items-center">
            <BrandMark size="sm" />
          </Link>
          <ThemeSwitcher compact />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
