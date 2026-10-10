import type { SearchScope } from "@/types/search";
export const searchScopes = [
  { value: "all", label: "Everything" },
  { value: "destinations", label: "Pages" },
  { value: "clubs", label: "Clubs" },
  { value: "events", label: "Events" },
  { value: "resources", label: "Resources" },
  { value: "accommodation", label: "Housing" },
  { value: "marketplace", label: "Market" },
  { value: "opportunities", label: "Opportunities" },
  { value: "announcements", label: "News" },
] as const satisfies readonly { value: SearchScope; label: string }[];
