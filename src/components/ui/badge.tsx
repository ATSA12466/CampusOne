import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const toneMap = {
  neutral: "bg-slate-100 text-slate-700",
  primary: "bg-blue-100 text-blue-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  gold: "bg-amber-100 text-amber-800",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof toneMap;
  className?: string;
}) {
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", toneMap[tone], className)}>{children}</span>;
}
