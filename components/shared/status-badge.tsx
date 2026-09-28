import React from "react";
import { Badge } from "@/components/ui/badge";
import { ShipmentStatus, PipelineStage } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface StatusBadgeProps {
  status: ShipmentStatus | PipelineStage | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getVariant = (
    val: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (val) {
      case "Delivered":
      case "completed":
        return "default";
      case "InTransit":
      case "in_transit":
      case "out_for_delivery":
        return "secondary";
      case "Compromised":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Badge variant={getVariant(status)} className={cn("capitalize", className)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
