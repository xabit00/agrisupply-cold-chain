import React from "react";
import { cn } from "@/lib/utils/cn";

export interface PageHeaderProps {
  heading: string;
  subheading?: string;
  badge?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  heading,
  subheading,
  badge,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {heading}
          </h1>
          {badge && (
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {badge}
            </span>
          )}
        </div>
        {subheading && (
          <p className="text-sm text-slate-500 max-w-2xl">{subheading}</p>
        )}
      </div>
      {(actions || children) && (
        <div className="flex flex-wrap items-center gap-2.5">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}

