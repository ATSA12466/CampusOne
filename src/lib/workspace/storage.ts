const cache = new Map<string, unknown[]>();
export const workspacePrefix = "campusone-workspace:";
export function privateWorkspaceKey(
  source: string,
  user?: { id: string; email: string } | null,
) {
  return user
    ? `${workspacePrefix}${source}:${encodeURIComponent(user.id)}:${encodeURIComponent(user.email.toLowerCase())}`
    : null;
}
export function readWorkspace(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const value: unknown = JSON.parse(raw);
      if (!Array.isArray(value)) throw new Error("Stored data is invalid");
      cache.set(key, value);
      return value;
    }
    return cache.get(key) ?? [];
  } catch (cause) {
    if (
      cause instanceof SyntaxError ||
      (cause instanceof Error && cause.message === "Stored data is invalid")
    )
      throw new Error(
        "Saved device data is damaged. Export or clear it in Settings before trying again.",
      );
    return cache.get(key) ?? [];
  }
}
export function writeWorkspace(key: string, items: unknown[]): boolean {
  cache.set(key, items);
  try {
    localStorage.setItem(key, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}
export function clearPrivateWorkspace(
  source: string,
  user?: { id: string; email: string } | null,
) {
  const prefix = privateWorkspaceKey(source, user);
  if (!prefix) return;
  for (const key of cache.keys())
    if (key.startsWith(prefix + ":")) {
      cache.delete(key);
      try {
        localStorage.removeItem(key);
      } catch {
        /* Deletion cannot be guaranteed when storage is denied. */
      }
    }
  try {
    for (const key of Object.keys(localStorage))
      if (key.startsWith(prefix + ":")) localStorage.removeItem(key);
  } catch {
    /* Memory is cleared; device deletion is not guaranteed. */
  }
}
