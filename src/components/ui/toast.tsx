"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { ToastMessage } from "@/types/ui";
type Stack = typeof import("./toast-stack").ToastStack;
const Context = createContext<((message: ToastMessage) => void) | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<(ToastMessage & { id: string })[]>([]);
  const [StackComponent, setStack] = useState<Stack | null>(null);
  const [failed, setFailed] = useState(false);
  const toast = useCallback(
    (message: ToastMessage) =>
      setMessages((current) => [...current.slice(-2), { ...message, id: crypto.randomUUID() }]),
    [],
  );
  const dismiss = (id: string) =>
    setMessages((current) => current.filter((message) => message.id !== id));
  useEffect(() => {
    if (!messages.length || StackComponent || failed) return;
    void import("./toast-stack")
      .then((module) => setStack(() => module.ToastStack))
      .catch(() => setFailed(true));
  }, [messages.length, StackComponent, failed]);
  return (
    <Context.Provider value={toast}>
      {children}
      {StackComponent ? (
        <StackComponent messages={messages} onDismiss={dismiss} />
      ) : failed ? (
        <div className="fixed right-4 bottom-24 z-100 w-[calc(100%-2rem)] max-w-sm space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              role={message.tone === "danger" ? "alert" : "status"}
              className="rounded-card border border-border bg-surface-raised p-4 shadow-raised"
            >
              <p className="text-sm font-semibold">{message.title}</p>
              {message.description ? (
                <p className="mt-1 text-xs text-muted-foreground">{message.description}</p>
              ) : null}
              <button
                type="button"
                className="mt-2 min-h-11 rounded-control px-2 text-xs font-semibold text-brand"
                aria-label="Dismiss notification"
                onClick={() => dismiss(message.id)}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </Context.Provider>
  );
}
export function useToast() {
  const toast = useContext(Context);
  if (!toast) throw new Error("useToast must be used within ToastProvider");
  return toast;
}
