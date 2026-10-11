import { authRoles } from "@/config/auth";
import { isAllowedImageSrc } from "@/config/image-policy";
import { campusInterests, levels, programmes } from "@/config/onboarding";
import type { ProfileSetup, StoredAuth } from "@/types/auth";
import type { UserProfile } from "@/types/common";
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
const text = (value: unknown, maximum: number) =>
  typeof value === "string" && value.length <= maximum && !/[\u0000-\u001f]/.test(value);
export function storedProfile(value: unknown): UserProfile | null {
  if (
    !record(value) ||
    !text(value.id, 100) ||
    !value.id ||
    !text(value.name, 80) ||
    !value.name ||
    !text(value.email, 254) ||
    !text(value.programme, 120) ||
    !text(value.level, 40) ||
    !authRoles.some((role) => role === value.role)
  )
    return null;
  const avatar =
    typeof value.avatar === "string" &&
    !value.avatar.startsWith("blob:") &&
    isAllowedImageSrc(value.avatar)
      ? value.avatar
      : undefined;
  return {
    id: value.id as string,
    name: value.name as string,
    email: value.email as string,
    role: value.role as UserProfile["role"],
    programme: value.programme as string,
    level: value.level as string,
    ...(avatar ? { avatar } : {}),
  };
}
export function storedAuth(value: unknown): StoredAuth {
  const source = record(value) && value.source === "api" ? "api" : "demo";
  const user = source === "demo" && record(value) ? storedProfile(value.user) : null;
  return {
    user,
    role: user?.role ?? "student",
    source,
    remember: !record(value) || value.remember !== false,
  };
}
export function storedOnboarding(value: unknown) {
  const item = record(value) ? value : {};
  const raw = record(item.preferences) ? item.preferences : {};
  const preferences: ProfileSetup = {
    name: typeof raw.name === "string" && text(raw.name, 80) ? raw.name : "",
    programme: programmes.find((p) => p === raw.programme) ?? programmes[0],
    level: levels.find((p) => p === raw.level) ?? levels[0],
    interests: campusInterests.filter(
      (p) => Array.isArray(raw.interests) && raw.interests.includes(p),
    ),
    portrait: raw.portrait === "ama" || raw.portrait === "kojo" ? raw.portrait : "initials",
  };
  return {
    completed: item.completed === true,
    step:
      typeof item.step === "number" &&
      Number.isInteger(item.step) &&
      item.step >= 0 &&
      item.step < 5
        ? item.step
        : 0,
    preferences,
  };
}
export function sameAccount(first: UserProfile | null, second: UserProfile) {
  return (
    !!first && first.id === second.id && first.email.toLowerCase() === second.email.toLowerCase()
  );
}
