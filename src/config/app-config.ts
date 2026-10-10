const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api";
export const appConfig = {
  appName: "CampusOne",
  apiBaseUrl: baseUrl.replace(/\/+$/, ""),
  dataSource: process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "demo",
  appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || undefined,
} as const;
