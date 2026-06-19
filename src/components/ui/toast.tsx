"use client";

import { create } from "zustand";

type ToastKind = "success" | "info" | "warn" | "error";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

let seq = 0;

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, message) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper usable from anywhere (event handlers). */
export const toast = {
  success: (m: string) => useToastStore.getState().push("success", m),
  info: (m: string) => useToastStore.getState().push("info", m),
  warn: (m: string) => useToastStore.getState().push("warn", m),
  error: (m: string) => useToastStore.getState().push("error", m),
};

const ICON: Record<ToastKind, string> = {
  success: "✅",
  info: "💬",
  warn: "⚠️",
  error: "⛔",
};
const ACCENT: Record<ToastKind, string> = {
  success: "border-accent-2/50",
  info: "border-accent/50",
  warn: "border-warn/50",
  error: "border-danger/50",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[min(92vw,380px)] -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border ${ACCENT[t.kind]} bg-panel/95 px-4 py-3 text-left text-sm shadow-2xl backdrop-blur-md`}
          style={{ animation: "toast-in 0.25s ease" }}
        >
          <span>{ICON[t.kind]}</span>
          <span className="flex-1">{t.message}</span>
        </button>
      ))}
    </div>
  );
}
