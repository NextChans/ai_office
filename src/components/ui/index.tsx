"use client";

import { useEffect } from "react";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:-translate-y-0.5",
  secondary: "border border-border bg-panel-2 text-text hover:bg-panel",
  ghost: "text-muted hover:bg-panel-2 hover:text-text",
  danger: "bg-danger/20 text-danger hover:bg-danger/30",
  success: "bg-accent-2/20 text-accent-2 hover:bg-accent-2/30",
};
const SIZE: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-all focus-ring disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-2xl border border-border bg-panel ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
export function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: "neutral" | "accent" | "success" | "warn" | "danger";
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "border-border bg-panel-2 text-muted",
    accent: "border-accent/40 bg-accent/15 text-accent",
    success: "border-accent-2/40 bg-accent-2/15 text-accent-2",
    warn: "border-warn/40 bg-warn/15 text-warn",
    danger: "border-danger/40 bg-danger/15 text-danger",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="col-span-full flex flex-col items-center rounded-2xl border border-dashed border-border bg-panel/40 px-6 py-12 text-center">
      <div className="mb-3 text-4xl opacity-80">{icon}</div>
      <p className="font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      style={{ animation: "fade-in 0.18s ease" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-2xl"
        style={{ animation: "pop-in 0.2s ease" }}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="rounded-lg px-2 py-1 text-muted hover:bg-panel-2 hover:text-text focus-ring"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text input (shared style)
// ---------------------------------------------------------------------------
export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-lg border border-border bg-panel-2 px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent ${className}`}
    />
  );
}
