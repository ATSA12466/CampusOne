import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("campus-card p-4 md:p-5", className)}>{children}</section>;
}
