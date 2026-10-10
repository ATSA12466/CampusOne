"use client";
import { useEffect, useState } from "react";
import { searchService } from "@/services";
import { searchQuerySchema } from "../validation/search.schema";
import type { SearchResponse, SearchScope, SearchService } from "@/types/search";
interface ResultState {
  version: number;
  query: string;
  scope: SearchScope;
  status: "ready" | "loading" | "error";
  data: SearchResponse;
  error?: string;
}
const empty: SearchResponse = { items: [], unavailable: [], hasMore: false };
export function useCampusSearch(
  query: string,
  scope: SearchScope,
  open: boolean,
  service: SearchService = searchService,
) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<ResultState>({
    version: 0,
    query: "",
    scope: "all",
    status: "loading",
    data: empty,
  });
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        setState({ version, query, scope, status: "loading", data: empty });
        const input = searchQuerySchema.safeParse({ query, scope });
        if (!input.success) {
          setState({
            version,
            query,
            scope,
            status: "error",
            data: empty,
            error: "Keep your search under 100 characters.",
          });
          return;
        }
        void service
          .search({ ...input.data, signal: controller.signal })
          .then((data) => {
            if (!controller.signal.aborted)
              setState({ version, query, scope, status: "ready", data });
          })
          .catch((error: unknown) => {
            if (!controller.signal.aborted)
              setState({
                version,
                query,
                scope,
                status: "error",
                data: empty,
                error:
                  error instanceof Error ? error.message : "Campus search couldn't be reached.",
              });
          });
      },
      query ? 225 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, scope, open, version, service]);
  const pending =
    query !== state.query ||
    scope !== state.scope ||
    version !== state.version ||
    state.status === "loading";
  return {
    ...state,
    data: pending ? empty : state.data,
    error: pending ? undefined : state.error,
    pending,
    retry: () => setVersion((value) => value + 1),
  };
}
