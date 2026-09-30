import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { AlertCircle } from "lucide-react";

interface FieldChildProps {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export interface FormFieldProps {
  /** Stable id — also used to wire label/error/hint a11y attributes. */
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + hint + error shell shared by every form control, so field markup and
 * a11y wiring (aria-invalid / aria-describedby) stay consistent across steps.
 */
export function FormField({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const child = React.isValidElement<FieldChildProps>(children)
    ? React.cloneElement(children, {
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
      })
    : children;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex min-h-5 min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <label
          htmlFor={id}
          className="static block min-w-0 text-xs font-semibold leading-5 text-slate-700"
        >
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
        {hint && (
          <span
            id={hintId}
            className="block shrink-0 text-[11px] leading-4 text-slate-400"
          >
            {hint}
          </span>
        )}
      </div>

      <div className="relative z-0 min-w-0 w-full">{child}</div>

      {error && (
        <p id={errorId} className="flex items-start gap-1 text-xs font-medium text-rose-600">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
