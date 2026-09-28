"use client";

import React from "react";
import { DataTable } from "@/components/shared/data-table";
import { Shipment } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils/formatters";

interface ShipmentTableProps {
  shipments: Shipment[];
  isLoading?: boolean;
}

export function ShipmentTable({ shipments, isLoading }: ShipmentTableProps) {
  const columns: ColumnDef<Shipment, unknown>[] = [
    {
      accessorKey: "trackingNumber",
      header: "Tracking #",
      cell: ({ row }) => (
        <span className="font-medium text-emerald-800">
          {row.getValue("trackingNumber")}
        </span>
      ),
    },
    {
      accessorKey: "produce.name",
      header: "Produce Item",
      cell: ({ row }) => row.original.produce.name,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ];

  return <DataTable columns={columns} data={shipments} isLoading={isLoading} />;
}
