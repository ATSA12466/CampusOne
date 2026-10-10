import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignFeature } from "@/features/design";
export const metadata: Metadata = {
  title: "Design foundations",
  description: "CampusOne's development-only component, media and theme showcase.",
  robots: { index: false, follow: false },
};
export default function DesignPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DesignFeature />;
}
