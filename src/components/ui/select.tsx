import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { fieldVariants } from "./input";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldVariants(), "pr-8", className)} {...props} />;
}
