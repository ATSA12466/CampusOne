import { createJSONStorage, type StateStorage } from "zustand/middleware";
const memory = new Map<string, string>();
const failures = new Set<string>();
export function storageFailed(key: string) {
  return failures.has(key);
}
export function noteStorageFailure(key: string) {
  failures.add(key);
}
export const safeStorage: StateStorage = {
  getItem(key) {
    try {
      return typeof window === "undefined" ? null : window.localStorage.getItem(key);
    } catch {
      failures.add(key);
      return memory.get(key) ?? null;
    }
  },
  setItem(key, value) {
    memory.set(key, value);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    } catch {
      failures.add(key);
    }
  },
  removeItem(key) {
    memory.delete(key);
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    } catch {
      failures.add(key);
    }
  },
};
export const safeJsonStorage = createJSONStorage(() => safeStorage);
