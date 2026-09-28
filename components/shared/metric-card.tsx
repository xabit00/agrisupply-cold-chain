import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = "default",
  className,
}: MetricCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          valColor: "text-slate-900",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 text-amber-700 border-amber-200",
          valColor: "text-slate-900",
        };
      case "danger":
        return {
          iconBg: "bg-rose-50 text-rose-700 border-rose-200",
          valColor: "text-rose-700",
        };
      default:
        return {
          iconBg: "bg-slate-50 text-slate-700 border-slate-200",
          valColor: "text-slate-900",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card className={cn("overflow-hidden shadow-sm hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </p>
          {Icon && (
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", styles.iconBg)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="mt-2.5">
          <p className={cn("text-2xl font-bold tracking-tight", styles.valColor)}>
            {value}
          </p>
        </div>

        {(subtitle || trend) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  "font-semibold",
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
            )}
            {subtitle && <span className="text-slate-500">{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
