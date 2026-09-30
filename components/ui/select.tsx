import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "relative z-0 block h-10 w-full min-w-0 rounded-md border border-input bg-white px-3 py-2 text-sm leading-5 text-slate-900 shadow-sm ring-offset-background transition-colors hover:border-slate-300 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";
