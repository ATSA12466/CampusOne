import { headers } from "next/headers";
import { appConfig } from "@/config/app-config";
import { sessionHeaders } from "@/services/api/session-headers";
export async function discoverServerOptions() {
  const request = await headers();
  return {
    headers:
      appConfig.dataSource === "api"
        ? sessionHeaders(
            request.get("cookie"),
            (process.env.API_SESSION_COOKIE_NAMES ?? "").split(","),
          )
        : {},
  };
}
