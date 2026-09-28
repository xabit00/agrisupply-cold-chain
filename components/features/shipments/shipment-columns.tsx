"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Shipment } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatTemperature } from "@/lib/utils/formatters";
import { Eye, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function getShipmentColumns(
  handleSort: (f: string) => void,
  onInspect: (s: Shipment) => void
): ColumnDef<Shipment, unknown>[] {
  return [
    {
      accessorKey: "trackingNumber",
      header: () => (
        <button onClick={() => handleSort("trackingNumber")} className="flex items-center gap-1 hover:text-slate-900">
          <span>Tracking ID</span> <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-emerald-800">
          {row.getValue("trackingNumber")}
        </span>
      ),
    },
    {
      accessorKey: "produce.name",
      header: () => (
        <button onClick={() => handleSort("produceName")} className="flex items-center gap-1 hover:text-slate-900">
          <span>Produce Item</span> <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-800">{row.original.produce.name}</p>
          <span className="text-[10px] text-slate-500">{row.original.produce.category}</span>
        </div>
      ),
    },
    {
      accessorKey: "produce.quantityKg",
      header: () => (
        <button onClick={() => handleSort("quantityKg")} className="flex items-center gap-1 hover:text-slate-900">
          <span>Batch Size</span> <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-700">
          {row.original.produce.quantityKg.toLocaleString()} kg
        </span>
      ),
    },
    {
      accessorKey: "produce.optimalTempMin",
      header: "SLA Temp Target",
      cell: ({ row }) => (
        <span className="text-xs text-slate-600">
          {formatTemperature(row.original.produce.optimalTempMin)} - {formatTemperature(row.original.produce.optimalTempMax)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <button onClick={() => handleSort("status")} className="flex items-center gap-1 hover:text-slate-900">
          <span>Status</span> <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <button onClick={() => handleSort("createdAt")} className="flex items-center gap-1 hover:text-slate-900">
          <span>Registered</span> <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "Inspect",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-xs text-slate-600 hover:text-emerald-700"
          onClick={() => onInspect(row.original)}
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> View
        </Button>
      ),
    },
  ];
}
