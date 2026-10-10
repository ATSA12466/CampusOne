import { appConfig } from "@/config/app-config";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}
