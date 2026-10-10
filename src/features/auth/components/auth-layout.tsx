import Link from "next/link";
import type { ReactNode } from "react";

export function AuthLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-bg)] px-4 py-10">
      <section className="campus-card w-full max-w-md p-6 md:p-8">
        <Link href="/home" className="text-sm font-semibold text-[var(--color-royal-blue)]">
          ← CampusOne
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
