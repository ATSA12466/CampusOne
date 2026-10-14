import { Badge } from "@/components/ui/badge";

const tones: Record<string, "neutral" | "primary" | "success" | "warning" | "danger" | "gold"> = {
  pending: "warning",
  new: "primary",
  draft: "neutral",
  approved: "success",
  active: "success",
  published: "success",
  resolved: "success",
  "in-review": "gold",
  rejected: "danger",
  revoked: "danger",
  expired: "neutral",
  closed: "neutral",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <Badge tone={tones[status] ?? "neutral"}>
      {status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </Badge>
  );
}
