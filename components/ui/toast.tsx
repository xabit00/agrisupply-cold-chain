import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-md border p-4 shadow-md bg-card text-card-foreground",
            toast.variant === "destructive" && "border-destructive text-destructive"
          )}
        >
          <p className="font-semibold text-sm">{toast.title}</p>
          {toast.description && (
            <p className="text-xs text-muted-foreground mt-1">{toast.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
