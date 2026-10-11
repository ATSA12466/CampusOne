"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useAuthAction() {
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  useEffect(
    () => () => {
      sequence.current++;
      controller.current?.abort();
    },
    [],
  );
  const run = useCallback(
    async <T>(action: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
      if (controller.current) return null;
      const current = ++sequence.current,
        abort = new AbortController();
      controller.current = abort;
      setPending(true);
      setError("");
      try {
        const result = await action(abort.signal);
        return current === sequence.current && !abort.signal.aborted ? result : null;
      } catch (cause) {
        if (current === sequence.current && !abort.signal.aborted)
          setError(
            cause instanceof Error && /chunk|dynamically imported module/i.test(cause.message)
              ? "The form service could not load. Your inputs are still on this page. Restore your connection, then save changes and reload before trying again."
              : cause instanceof Error && cause.name !== "TimeoutError"
                ? cause.message
                : "The request took too long. Your inputs are still here; try again.",
          );
        return null;
      } finally {
        if (current === sequence.current) {
          controller.current = null;
          setPending(false);
        }
      }
    },
    [],
  );
  const cancel = useCallback(() => {
    sequence.current++;
    controller.current?.abort();
    controller.current = null;
    setPending(false);
    setError("");
  }, []);
  return { pending, error, run, cancel };
}
