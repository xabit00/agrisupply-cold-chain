import React from "react";
import { Badge } from "@/components/ui/badge";
import { ShipmentStatus, PipelineStage } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export type StatusType = ShipmentStatus | PipelineStage | "BREACH" | "NORMAL" | "TAMPER" | string;

interface StatusBadgeProps {
  status: StatusType;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  const getBadgeStyle = (val: string): { bg: string; text: string; border: string; dot: string } => {
    switch (val) {
      case "Delivered":
      case "completed":
      case "NORMAL":
        return {
          bg: "bg-emerald-50 text-emerald-700",
          text: "text-emerald-700",
          border: "border-emerald-200",
          dot: "bg-emerald-500",
        };
      case "InTransit":
      case "in_transit":
      case "out_for_delivery":
        return {
          bg: "bg-sky-50 text-sky-700",
          text: "text-sky-700",
          border: "border-sky-200",
          dot: "bg-sky-500 animate-pulse",
        };
      case "ColdStorage":
      case "warehouse_hold":
      case "packed_inspected":
        return {
          bg: "bg-amber-50 text-amber-700",
          text: "text-amber-700",
          border: "border-amber-200",
          dot: "bg-amber-500",
        };
      case "Compromised":
      case "BREACH":
      case "TAMPER":
        return {
          bg: "bg-rose-50 text-rose-700",
          text: "text-rose-700",
          border: "border-rose-200",
          dot: "bg-rose-500 animate-ping",
        };
      case "Harvested":
      case "order_placed":
      case "Draft":
      default:
        return {
          bg: "bg-slate-50 text-slate-700",
          text: "text-slate-700",
          border: "border-slate-200",
          dot: "bg-slate-400",
        };
    }
  };

  const style = getBadgeStyle(status);
  const formattedText = status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize transition-colors",
        style.bg,
        style.border,
        className
      )}
    >
      {showDot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)}
          aria-hidden="true"
        />
      )}
      <span className={style.text}>{formattedText}</span>
    </span>
  );
}

