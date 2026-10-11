import type { AuthPreview } from "@/types/auth";
import { studentReturnPath } from "@/lib/auth/return-path";
export async function authRouteOptions(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
) {
  const query = await searchParams;
  const preview: AuthPreview | undefined =
    process.env.NODE_ENV === "development" &&
    (query["auth-preview"] === "error" || query["auth-preview"] === "slow")
      ? query["auth-preview"]
      : undefined;
  return { next: studentReturnPath(query.next), preview };
}
