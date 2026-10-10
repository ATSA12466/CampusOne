import type { z } from "zod";
import { appConfig } from "@/config/app-config";

export class ApiError extends Error {
  readonly status: number;
  readonly code: "NETWORK" | "HTTP" | "VALIDATION";
  constructor(message: string, status: number, code: "NETWORK" | "HTTP" | "VALIDATION" = "HTTP") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
interface Options<T> extends RequestInit {
  schema: z.ZodType<T>;
  baseUrl?: string;
}
export function apiUrl(path: string, baseUrl = appConfig.apiBaseUrl) {
  let pathname: string;
  try {
    pathname = decodeURIComponent(path.split("?")[0]);
  } catch {
    throw new ApiError("Invalid API resource path", 400);
  }
  if (
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    /[\\\u0000-\u001f#]/.test(pathname) ||
    /(?:^|\/)(?:\.|\.\.)(?:\/|$)/.test(pathname)
  ) {
    throw new ApiError("Invalid API resource path", 400);
  }
  let base = baseUrl.replace(/\/+$/, "");
  if (!base.startsWith("/")) {
    let url: URL;
    try {
      url = new URL(base);
    } catch {
      throw new ApiError("The API base URL is not configured correctly.", 400);
    }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      throw new ApiError("Use an HTTP(S) API URL without credentials.", 400);
    }
    if (
      typeof window !== "undefined" &&
      ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"].includes(url.hostname)
    ) {
      throw new ApiError(
        "Use /api for local or preview requests, with API_PROXY_TARGET on the server.",
        400,
      );
    }
  } else if (base.startsWith("//")) throw new ApiError("Use a root-relative API base URL.", 400);
  if (typeof window === "undefined" && base.startsWith("/")) {
    // Only the server takes this branch. Browsers always use the same-origin proxy.
    base = `${(process.env.API_PROXY_TARGET || "http://127.0.0.1:4000").replace(/\/+$/, "")}${base}`;
  }
  return `${base}${path}`;
}
export async function apiClient<T>(
  path: string,
  { schema, baseUrl, ...init }: Options<T>,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const url = apiUrl(path, baseUrl);
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers, credentials: init.credentials ?? "include" });
  } catch (cause) {
    if (init.signal?.aborted || (cause instanceof Error && cause.name === "AbortError"))
      throw cause;
    throw new ApiError(
      "You're offline or CampusOne couldn't be reached. Please retry.",
      0,
      "NETWORK",
    );
  }
  if (!response.ok)
    throw new ApiError(
      response.status === 401
        ? "Please sign in again to continue."
        : response.status === 404
          ? "This campus item is no longer available."
          : "CampusOne couldn't complete this request. Please retry.",
      response.status,
    );
  let payload: unknown;
  try {
    payload = response.status === 204 ? undefined : await response.json();
  } catch (cause) {
    if (init.signal?.aborted) throw cause;
    throw new ApiError(
      "CampusOne received an unexpected response. Please retry.",
      502,
      "VALIDATION",
    );
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success)
    throw new ApiError(
      "CampusOne received an unexpected response. Please retry.",
      502,
      "VALIDATION",
    );
  return parsed.data;
}
