export const approvedImageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);
export function isAllowedImageSrc(src: string) {
  if (/[\\\u0000-\u001f]/.test(src)) return false;
  if (src.startsWith("/") && !src.startsWith("//")) {
    try {
      return !/(?:^|\/)(?:\.|\.\.)(?:\/|$)/.test(decodeURIComponent(src.split("?")[0]));
    } catch {
      return false;
    }
  }
  if (src.startsWith("blob:")) return true;
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      approvedImageHosts.includes(url.hostname)
    );
  } catch {
    return false;
  }
}
