"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { useToastStore } from "@/stores/toast.store";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

const VARIANT_CONFIG: Record<
  "default" | "destructive",
  { border: string; icon: React.ElementType; iconClass: string }
> = {
  default: {
    border: "border-emerald-200 bg-emerald-50",
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
  },
  destructive: {
    border: "border-rose-200 bg-rose-50",
    icon: AlertTriangle,
    iconClass: "text-rose-600",
  },
};

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toastItem) => {
        const config = VARIANT_CONFIG[toastItem.variant ?? "default"];
        const Icon = config.icon;

        return (
          <div
            key={toastItem.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border p-3.5 shadow-lg animate-in fade-in slide-in-from-bottom-2",
              config.border
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.iconClass)} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{toastItem.title}</p>
              {toastItem.description && (
                <p className="mt-0.5 text-xs text-slate-600 break-words">{toastItem.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toastItem.id)}
              aria-label="Dismiss notification"
              className="rounded p-0.5 text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Store-connected viewport. Mount once (root layout) and raise toasts from
 * anywhere via the imperative `toast` helper or `useToast()`.
 */
export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return <ToastContainer toasts={toasts} onDismiss={dismiss} />;
}

