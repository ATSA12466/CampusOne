import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { AppearanceTrigger } from "@/components/theme/appearance-trigger";
import { appConfig } from "@/config/app-config";
import { authStories } from "@/config/auth";
import { PhotoStory } from "./photo-story";
export function AuthLayout({
  title,
  description,
  story = "signin",
  children,
}: {
  title: string;
  description: string;
  story?: keyof typeof authStories;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <header className="auth-page-header">
        <Link
          prefetch={false}
          href="/home"
          className="inline-flex min-h-11 rounded-control"
          aria-label="CampusOne home"
        >
          <BrandMark size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:block">
            Independent student-life prototype
          </span>
          <AppearanceTrigger />
        </div>
      </header>
      <div className="auth-page-grid">
        <PhotoStory {...authStories[story]} />
        <section className="auth-form-panel" aria-labelledby="auth-title">
          <div className="mb-7">
            <span className="auth-eyebrow">
              {appConfig.dataSource === "demo"
                ? "LOCAL DEMO · NO REAL ACCOUNT"
                : "API PREVIEW · BACKEND REQUIRED"}
            </span>
            <h1 id="auth-title" className="mt-3 text-title font-semibold text-balance">
              {title}
            </h1>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
          <footer
            id="preview-notice"
            className="mt-8 border-t border-border pt-5 text-[11px] text-muted-foreground"
          >
            {appConfig.dataSource === "demo"
              ? "This preview stores profile details and activity on this browser, never your password. No real account or reset email is created. Use made-up details, not your LMS/SIP password."
              : "These proposed API endpoints require a real secure backend. Sessions, authorization, CSRF protection and reset-email delivery must be enforced on the server."}
            <p className="mt-2">
              CampusOne is an independent prototype, not an official GCTU or SRC service.
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}
