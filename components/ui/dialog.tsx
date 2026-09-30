"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Blocks Esc + backdrop dismissal (e.g. while a mutation is in flight). */
  disableDismiss?: boolean;
  /** Whether a direct click on the backdrop may close the dialog. */
  closeOnOverlayClick?: boolean;
  /** Whether Escape may close the dialog. */
  closeOnEscape?: boolean;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  disableDismiss = false,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  // Lock body scroll and handle Escape key
  React.useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape && !disableDismiss) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // FIX 2: Restore scroll position on close
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [open, onClose, disableDismiss, closeOnEscape]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] isolate flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(e) => {
        if (
          closeOnOverlayClick &&
          e.target === overlayRef.current &&
          !disableDismiss
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          "pointer-events-auto relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl outline-none",
          "my-3 max-h-[calc(100dvh-1.5rem)] overflow-x-hidden overflow-y-auto p-4 sm:my-4 sm:max-h-[calc(100dvh-2rem)] sm:p-6",
          className
        )}
      >
        {/* Sticky header so title stays visible when scrolling long forms */}
        <div className="sticky top-0 z-20 -mx-4 -mt-4 mb-5 flex items-start justify-between gap-4 rounded-t-xl border-b border-slate-100 bg-white px-4 pb-4 pt-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold leading-none tracking-tight text-slate-900">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={disableDismiss}
            aria-label="Close dialog"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative z-0 min-w-0">{children}</div>
      </div>
    </div>
  );
}
