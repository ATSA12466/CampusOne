const studentRoots = new Set([
  "home",
  "discover",
  "academics",
  "calendar",
  "timetable",
  "tasks",
  "study-assistant",
  "clubs",
  "events",
  "participation",
  "community",
  "messages",
  "notifications",
  "media",
  "src-office",
  "announcements",
  "management",
  "accommodation",
  "marketplace",
  "lost-and-found",
  "opportunities",
  "profile",
  "settings",
  "advertising",
]);
const details = new Set([
  "clubs",
  "events",
  "academics",
  "announcements",
  "opportunities",
  "accommodation",
  "marketplace",
]);
export function studentReturnPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length > 300 ||
    !/^\/[a-zA-Z0-9/_%-]+$/.test(value) ||
    value.startsWith("//")
  )
    return "/home";
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return "/home";
  }
  if (
    !/^\/[a-zA-Z0-9/_-]+$/.test(decoded) ||
    /[\\\u0000-\u001f?#]/.test(decoded) ||
    /(?:^|\/)(?:\.|\.\.)(?:\/|$)/.test(decoded) ||
    decoded.includes("//")
  )
    return "/home";
  const parts = decoded.split("/").filter(Boolean);
  if (!studentRoots.has(parts[0])) return "/home";
  if (parts.length > 1 && !details.has(parts[0])) return "/home";
  if (
    parts[0] === "academics" &&
    parts.length > 1 &&
    (parts.length !== 3 || parts[1] !== "resources")
  )
    return "/home";
  if (parts[0] !== "academics" && parts.length > 2) return "/home";
  return value;
}
