import type { SearchPreviewMode, SearchService } from "@/types/search";
// Development-showcase fixtures, not a live API. Slow mode deliberately ignores
// cancellation to prove the UI also guards against late, uncooperative replies.
export function createSearchPreviewService(
  base: SearchService,
  mode: SearchPreviewMode,
): SearchService {
  let requests = 0;
  return {
    async search(input) {
      requests++;
      if (mode === "error" && requests === 1) throw new Error("Controlled showcase failure");
      if (mode === "slow") {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, input.query === "Code" ? 3000 : 40),
        );
        return base.search({ ...input, signal: undefined });
      }
      const response = await base.search(input);
      return mode === "partial" && requests === 1
        ? { ...response, unavailable: ["clubs"] }
        : response;
    },
  };
}
