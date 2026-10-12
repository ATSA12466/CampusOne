import { useAppStore } from "@/stores/app-store";
export const verifyLocalChange = (
  change: () => void,
  verify: () => boolean,
) => {
  try {
    change();
  } catch {
    if (!verify()) throw new Error("The local change failed. Please retry.");
    return { persisted: false };
  }
  if (!verify()) throw new Error("The local change could not be verified.");
  try {
    const raw = localStorage.getItem("campusone-app");
    if (!raw) return { persisted: false };
    const snapshot: unknown = JSON.parse(raw);
    if (!snapshot || typeof snapshot !== "object" || !("state" in snapshot))
      return { persisted: false };
    const saved = snapshot.state;
    if (
      !saved ||
      typeof saved !== "object" ||
      !("bookmarks" in saved) ||
      !("srcRequests" in saved)
    )
      return { persisted: false };
    return {
      persisted:
        JSON.stringify(saved.bookmarks) ===
          JSON.stringify(useAppStore.getState().bookmarks) &&
        JSON.stringify(saved.srcRequests) ===
          JSON.stringify(useAppStore.getState().srcRequests),
    };
  } catch {
    return { persisted: false };
  }
};
