// Pure adapter; invoked only by Server Components, never serialized to the client.
export function sessionHeaders(
  cookieHeader: string | null,
  names: readonly string[],
): Record<string, string> {
  if (!cookieHeader || /[\u0000-\u001f\u007f]/.test(cookieHeader)) return {};
  const allowed = new Set(
    names.map((name) => name.trim()).filter((name) => /^[!#$%&'*+\-.^_`|~\w]+$/.test(name)),
  );
  const selected = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => {
      const equals = cookie.indexOf("=");
      return equals > 0 && allowed.has(cookie.slice(0, equals));
    });
  return selected.length ? { Cookie: selected.join("; ") } : {};
}
